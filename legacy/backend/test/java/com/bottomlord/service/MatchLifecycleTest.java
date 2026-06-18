package com.bottomlord.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.bottomlord.dto.GroupsVO;
import com.bottomlord.dto.SettlementRequest;
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

import java.math.BigDecimal;
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

    @SuppressWarnings("unchecked")
    private Wrapper<MatchRegistration> anyRegistrationWrapper() {
        return any(Wrapper.class);
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
    @DisplayName("发布结算信息后赛事状态保持 MATCH_FINISHED")
    void saveAndPublishSettlementShouldKeepMatchFinishedStatus() {
        Match match = new Match();
        match.setId(1L);
        match.setTournamentId(100L);
        match.setTitle("周三夜赛");
        match.setStatus(Match.STATUS_MATCH_FINISHED);
        match.setSettlementPublished(false);

        when(matchMapper.selectById(1L)).thenReturn(match);

        MatchRegistration normalReg = new MatchRegistration();
        normalReg.setId(11L);
        normalReg.setMatchId(1L);
        normalReg.setPlayerId(101L);
        normalReg.setStatus("REGISTERED");
        normalReg.setIsExempt(false);
        normalReg.setPaymentStatus(null);
        normalReg.setPaymentAmount(null);

        MatchRegistration exemptReg = new MatchRegistration();
        exemptReg.setId(12L);
        exemptReg.setMatchId(1L);
        exemptReg.setPlayerId(102L);
        exemptReg.setStatus("REGISTERED");
        exemptReg.setIsExempt(false);
        exemptReg.setPaymentStatus("UNPAID");
        exemptReg.setPaymentAmount(new BigDecimal("30.00"));

        when(registrationService.list(anyRegistrationWrapper())).thenReturn(Arrays.asList(normalReg, exemptReg));

        SettlementRequest request = new SettlementRequest();
        request.setTotalCost(new BigDecimal("88.00"));
        request.setPublish(true);

        SettlementRequest.SettlementRegistrationDTO normalDto = new SettlementRequest.SettlementRegistrationDTO();
        normalDto.setPlayerId(101L);
        normalDto.setIsExempt(false);
        normalDto.setPaymentAmount(new BigDecimal("44.00"));

        SettlementRequest.SettlementRegistrationDTO exemptDto = new SettlementRequest.SettlementRegistrationDTO();
        exemptDto.setPlayerId(102L);
        exemptDto.setIsExempt(true);
        exemptDto.setPaymentAmount(BigDecimal.ZERO);

        request.setRegistrations(Arrays.asList(normalDto, exemptDto));

        matchService.saveAndPublishSettlement(1L, request);

        assertEquals(Match.STATUS_MATCH_FINISHED, match.getStatus());
        assertTrue(Boolean.TRUE.equals(match.getSettlementPublished()));
        assertEquals(new BigDecimal("88.00"), match.getTotalCost());

        assertEquals(new BigDecimal("44.00"), normalReg.getPaymentAmount());
        assertEquals("UNPAID", normalReg.getPaymentStatus());
        assertFalse(Boolean.TRUE.equals(normalReg.getIsExempt()));

        assertTrue(Boolean.TRUE.equals(exemptReg.getIsExempt()));
        assertEquals(BigDecimal.ZERO, exemptReg.getPaymentAmount());
        assertEquals("PAID", exemptReg.getPaymentStatus());

        verify(registrationService, times(2)).updateById(any(MatchRegistration.class));
        verify(sseManager).broadcastToClub(100L, "match_settled", "周三夜赛 结算信息已发布");
    }

    @Test
    @DisplayName("非 MATCH_FINISHED 状态不可保存结算信息")
    void saveAndPublishSettlementShouldRejectNonFinishedMatch() {
        Match match = new Match();
        match.setId(2L);
        match.setStatus(Match.STATUS_ONGOING);

        when(matchMapper.selectById(2L)).thenReturn(match);

        SettlementRequest request = new SettlementRequest();
        request.setTotalCost(new BigDecimal("66.00"));
        request.setPublish(true);
        request.setRegistrations(Collections.emptyList());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> matchService.saveAndPublishSettlement(2L, request));

        assertEquals("赛事未结束，无法保存结算信息", ex.getMessage());
        verify(registrationService, never()).list(anyRegistrationWrapper());
        verify(sseManager, never()).broadcastToClub(anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("closeRegistration 正常将 PUBLISHED 状态关闭为 REGISTRATION_CLOSED")
    void closeRegistrationShouldTransitionFromPublishedToRegistrationClosed() {
        Match match = new Match();
        match.setId(3L);
        match.setStatus(Match.STATUS_PUBLISHED);

        when(matchMapper.selectById(3L)).thenReturn(match);

        matchService.closeRegistration(3L);

        assertEquals(Match.STATUS_REGISTRATION_CLOSED, match.getStatus());
        verify(matchMapper).updateById(match);
    }

    @Test
    @DisplayName("closeRegistration 在非 PUBLISHED 状态下抛出 IllegalStateException")
    void closeRegistrationShouldRejectNonPublishedMatch() {
        Match match = new Match();
        match.setId(4L);
        match.setStatus(Match.STATUS_REGISTRATION_CLOSED);

        when(matchMapper.selectById(4L)).thenReturn(match);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> matchService.closeRegistration(4L));

        assertEquals("只有在报名阶段才能关闭报名", ex.getMessage());
        verify(matchMapper, never()).updateById(any(Match.class));
    }
}
