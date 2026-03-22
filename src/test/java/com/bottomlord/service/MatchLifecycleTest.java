package com.bottomlord.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bottomlord.dto.GroupsVO;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.mapper.MatchMapper;
import com.bottomlord.service.impl.MatchServiceImpl;
import com.bottomlord.strategy.GroupingStrategy;
import com.bottomlord.strategy.GroupingStrategyFactory;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 赛事生命周期集成测试 (基于 Mockito)
 */
@ExtendWith(MockitoExtension.class)
class MatchLifecycleTest {

    @InjectMocks
    private MatchServiceImpl matchService;

    @Mock
    private MatchMapper matchMapper;

    @Mock
    private MatchRegistrationService registrationService;

    @Mock
    private MatchGameService gameService;

    @Mock
    private PlayerService playerService;

    @Mock
    private GroupingStrategyFactory strategyFactory;

    @Mock
    private GroupingStrategy mockStrategy;

    @Mock
    private com.bottomlord.common.util.SseManager sseManager;

    @BeforeAll
    static void initMybatisPlus() {
        // 手动初始化 MyBatis-Plus 的表信息缓存，以支持 LambdaUpdateWrapper 在单元测试中运行
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), MatchRegistration.class);
    }

    @BeforeEach
    void setUp() {
        // 解决 MyBatis-Plus ServiceImpl 中的 baseMapper 无法通过 @InjectMocks 注入的问题
        ReflectionTestUtils.setField(matchService, "baseMapper", matchMapper);
    }

    @Test
    @DisplayName("测试赛事发布、分组及生成场次完整流程")
    void testMatchLifecycle() {
        // 1. 模拟发布赛事
        Match match = new Match();
        match.setId(1L);
        match.setNumGroups(2);
        match.setPlayersPerGroup(5);
        match.setStatus(Match.STATUS_PUBLISHED);
        
        when(matchMapper.selectById(1L)).thenReturn(match);

        // 2. 模拟获取报名人员
        List<MatchRegistration> mockRegs = new ArrayList<>();
        for (long i = 1; i <= 10; i++) {
            MatchRegistration reg = new MatchRegistration();
            reg.setPlayerId(i);
            mockRegs.add(reg);
        }
        when(registrationService.getValidRegistrations(1L)).thenReturn(mockRegs);

        // 3. 模拟算法工厂返回特定的分配策略
        Map<Integer, List<Long>> mockAllocation = new HashMap<>();
        mockAllocation.put(0, Arrays.asList(1L, 3L, 5L, 7L, 9L));
        mockAllocation.put(1, Arrays.asList(2L, 4L, 6L, 8L, 10L));
        
        when(strategyFactory.getDefaultStrategy()).thenReturn(mockStrategy);
        when(mockStrategy.allocate(anyList(), eq(2), anyMap())).thenReturn(mockAllocation);
        when(playerService.listByIds(anyList())).thenReturn(new ArrayList<>());

        // Act - 1. 执行自动分组草稿（持久化 group_index，不更改赛事状态）
        GroupsVO groupsVO = matchService.confirmAndGroup(1L, new com.bottomlord.dto.GroupingRequest());

        // Assert - 验证草稿结果，状态保持 PUBLISHED
        assertNotNull(groupsVO);
        assertEquals(Match.STATUS_PUBLISHED, match.getStatus());

        // 模拟报名截止（publishGroups 和 startMatch 需要 REGISTRATION_CLOSED）
        match.setStatus(Match.STATUS_REGISTRATION_CLOSED);

        // 模拟所有球员已分配组别
        mockRegs.forEach(r -> r.setGroupIndex(r.getPlayerId() <= 5 ? 0 : 1));
        match.setGroupsPublished(false);

        // Act - 2. 发布分组（使分组对所有人可见）
        matchService.publishGroups(1L);

        // Assert - 验证分组已发布
        assertTrue(Boolean.TRUE.equals(match.getGroupsPublished()));

        // Act - 3. 正式开赛（需 REGISTRATION_CLOSED 且所有人已分配）
        matchService.startMatch(1L, LocalDateTime.now());

        // Assert - 验证最终状态与副作用
        assertEquals(Match.STATUS_ONGOING, match.getStatus());

        // 验证场次生成被调用 (2支队伍只有 1 场比赛)
        verify(gameService, times(1)).save(any());
    }

    @Test
    @DisplayName("getMatchDetail: 报名截止时间已过但开赛时间未到，自动从 PUBLISHED 切换为 REGISTRATION_CLOSED")
    void testStatusSync_publishedToRegistrationClosed() {
        Match match = new Match();
        match.setId(10L);
        match.setTournamentId(1L);
        match.setStatus(Match.STATUS_PUBLISHED);
        match.setRegistrationDeadline(LocalDateTime.now().minusHours(1));
        match.setStartTime(LocalDateTime.now().plusHours(2));

        when(matchMapper.selectById(10L)).thenReturn(match);

        Match result = matchService.getMatchDetail(10L);

        assertEquals(Match.STATUS_REGISTRATION_CLOSED, result.getStatus());
        verify(matchMapper).updateById(match);
    }

    @Test
    @DisplayName("getMatchDetail: 报名截止时间未到时，保持 PUBLISHED 状态不变")
    void testStatusSync_publishedStaysWhenDeadlineNotReached() {
        Match match = new Match();
        match.setId(11L);
        match.setTournamentId(1L);
        match.setStatus(Match.STATUS_PUBLISHED);
        match.setRegistrationDeadline(LocalDateTime.now().plusHours(2));

        when(matchMapper.selectById(11L)).thenReturn(match);

        Match result = matchService.getMatchDetail(11L);

        assertEquals(Match.STATUS_PUBLISHED, result.getStatus());
        verify(matchMapper, never()).updateById(any(Match.class));
    }

    @Test
    @DisplayName("registerForMatch: 报名截止时间已过时，状态同步后拒绝报名")
    void testRegisterForMatch_rejectedAfterDeadlineViaSync() {
        Match match = new Match();
        match.setId(12L);
        match.setTournamentId(1L);
        match.setStatus(Match.STATUS_PUBLISHED);
        match.setRegistrationDeadline(LocalDateTime.now().minusMinutes(30));
        match.setStartTime(LocalDateTime.now().plusHours(2));

        when(matchMapper.selectById(12L)).thenReturn(match);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> matchService.registerForMatch(12L, 99L));

        assertEquals("当前赛事未开放报名", ex.getMessage());
        assertEquals(Match.STATUS_REGISTRATION_CLOSED, match.getStatus());
        verify(matchMapper).updateById(match);
    }

    @Test
    @DisplayName("getMatchDetail: 报名截止和开赛时间均已过时，PUBLISHED 链式推进至 ONGOING")
    void testStatusSync_publishedChainsToOngoing() {
        Match match = new Match();
        match.setId(20L);
        match.setTournamentId(1L);
        match.setStatus(Match.STATUS_PUBLISHED);
        match.setRegistrationDeadline(LocalDateTime.now().minusHours(2));
        match.setStartTime(LocalDateTime.now().minusHours(1));

        when(matchMapper.selectById(20L)).thenReturn(match);

        Match result = matchService.getMatchDetail(20L);

        assertEquals(Match.STATUS_ONGOING, result.getStatus());
        verify(matchMapper).updateById(match);
    }

    @Test
    @DisplayName("getMatchDetail: REGISTRATION_CLOSED 状态下开赛时间已过，推进至 ONGOING")
    void testStatusSync_registrationClosedToOngoing() {
        Match match = new Match();
        match.setId(21L);
        match.setTournamentId(1L);
        match.setStatus(Match.STATUS_REGISTRATION_CLOSED);
        match.setStartTime(LocalDateTime.now().minusMinutes(30));

        when(matchMapper.selectById(21L)).thenReturn(match);

        Match result = matchService.getMatchDetail(21L);

        assertEquals(Match.STATUS_ONGOING, result.getStatus());
        verify(matchMapper).updateById(match);
    }

}
