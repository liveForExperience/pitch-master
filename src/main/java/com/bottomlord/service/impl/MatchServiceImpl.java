package com.bottomlord.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.common.util.SseManager;
import com.bottomlord.dto.GroupingRequest;
import com.bottomlord.dto.GroupsVO;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.entity.MatchScoreLog;
import com.bottomlord.entity.PlayerMutualRating;
import com.bottomlord.mapper.GameParticipantMapper;
import com.bottomlord.mapper.MatchGoalMapper;
import com.bottomlord.mapper.MatchMapper;
import com.bottomlord.mapper.MatchScoreLogMapper;
import com.bottomlord.mapper.PlayerMutualRatingMapper;
import com.bottomlord.service.MatchService;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchRegistrationService;
import com.bottomlord.service.PlayerService;
import com.bottomlord.strategy.GroupingStrategy;
import com.bottomlord.strategy.GroupingStrategyFactory;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.entity.Tournament;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 赛事服务实现类 (支持动态报名逻辑与状态回退)
 */
@Service
public class MatchServiceImpl extends ServiceImpl<MatchMapper, Match> implements MatchService {

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private MatchGameService gameService;

    @Autowired
    private PlayerService playerService;

    @Autowired
    private GroupingStrategyFactory strategyFactory;

    @Autowired
    private SseManager sseManager;

    @Autowired
    private TournamentMapper tournamentMapper;

    @Autowired
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Autowired
    private MatchGoalMapper matchGoalMapper;

    @Autowired
    private GameParticipantMapper gameParticipantMapper;

    @Autowired
    private MatchScoreLogMapper matchScoreLogMapper;

    @Autowired
    private PlayerMutualRatingMapper playerMutualRatingMapper;

    @Override
    public Match getMatchDetail(Long matchId) {
        return this.getById(matchId);
    }

    @Override
    public List<Match> listUpcomingMatches() {
        boolean isAdmin = SecurityUtils.getSubject().hasRole("admin");
        LambdaQueryWrapper<Match> wrapper = new LambdaQueryWrapper<Match>()
                .isNull(Match::getDeletedAt)
                .ne(Match::getStatus, Match.STATUS_CANCELLED)
                .orderByDesc(Match::getStartTime);
        // 普通用户只能看到已发布的赛事 (PUBLISHED 及之后的)，管理员可以看到筹备中的赛事
        if (!isAdmin) {
            wrapper.ne(Match::getStatus, Match.STATUS_PREPARING);
        }
        List<Match> matches = this.list(wrapper);
        
        if (CollUtil.isNotEmpty(matches)) {
            List<Tournament> tournaments = tournamentMapper.selectList(null);
            Map<Long, String> tournamentMap = tournaments.stream()
                    .collect(Collectors.toMap(Tournament::getId, Tournament::getName));
            
            matches.forEach(m -> m.setTournamentName(tournamentMap.get(m.getTournamentId())));
        }
        
        return matches;
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public Match publishMatch(Match match) {
        match.setStatus(Match.STATUS_PREPARING);
        if (match.getTournamentId() == null) {
            match.setTournamentId(1L); // 默认租户
        }
        if (match.getStartTime() != null) {
            if (match.getRegistrationDeadline() == null) {
                match.setRegistrationDeadline(match.getStartTime().minusHours(4));
            }
            if (match.getCancelDeadline() == null) {
                match.setCancelDeadline(match.getRegistrationDeadline());
            }
        }
        this.save(match);
        return match;
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public Match updateMatch(Long matchId, Match match) {
        Match existing = this.getById(matchId);
        if (existing == null) {
            throw new IllegalArgumentException("赛事不存在");
        }
        if (!Match.STATUS_PREPARING.equals(existing.getStatus())) {
            throw new IllegalStateException("只能编辑筹备中的赛事");
        }
        match.setId(matchId);
        match.setStatus(Match.STATUS_PREPARING);
        if (match.getTournamentId() == null) {
            match.setTournamentId(existing.getTournamentId());
        }
        this.updateById(match);
        return match;
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void startRegistration(Long matchId) {
        Match match = this.getById(matchId);
        if (match == null) throw new IllegalArgumentException("赛事不存在");
        if (!Match.STATUS_PREPARING.equals(match.getStatus())) {
            throw new IllegalStateException("只有处于筹备中的赛事才能开启报名");
        }
        match.setStatus(Match.STATUS_PUBLISHED);
        this.updateById(match);
        sseManager.broadcastToClub(match.getTournamentId(), "registration_open", match.getTitle() + " 已开放报名！");
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void revertToPreparing(Long matchId) {
        Match match = this.getById(matchId);
        if (match == null) return;
        if (!Match.STATUS_PUBLISHED.equals(match.getStatus())) {
            throw new IllegalStateException("只有在报名阶段才能撤回至筹备阶段");
        }
        match.setStatus(Match.STATUS_PREPARING);
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateRegistrationDeadline(Long matchId, LocalDateTime newDeadline) {
        Match match = this.getById(matchId);
        if (match == null) return;
        
        match.setRegistrationDeadline(newDeadline);
        
        // 如果当前是“报名截止”状态且新时间是未来，则自动翻转回“报名中”
        if (Match.STATUS_REGISTRATION_CLOSED.equals(match.getStatus()) && newDeadline.isAfter(LocalDateTime.now())) {
            match.setStatus(Match.STATUS_PUBLISHED);
        }
        
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void deleteMatch(Long matchId) {
        Match match = this.getById(matchId);
        if (match == null) return;
        if (!Match.STATUS_PREPARING.equals(match.getStatus())) {
            throw new IllegalStateException("只有处于筹备中的赛事才能直接删除");
        }
        this.removeById(matchId);
    }

    @Override 
    @Transactional(rollbackFor = Exception.class)
    public void registerForMatch(Long matchId, Long playerId) {
        Match match = this.getById(matchId);
        if (match == null) throw new IllegalArgumentException("赛事不存在");

        if (!Match.STATUS_PUBLISHED.equals(match.getStatus())) {
            throw new IllegalStateException("当前赛事未开放报名");
        }

        // 检查是否已有有效报名
        long activeCount = registrationService.count(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .in(MatchRegistration::getStatus, "REGISTERED", "PENDING"));
        
        if (activeCount > 0) throw new IllegalStateException("已报名该赛事");

        // 计算容量：numGroups * playersPerGroup
        int capacity = match.getNumGroups() * match.getPlayersPerGroup();
        long registeredCount = registrationService.count(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getStatus, "REGISTERED"));

        // 判断是否超出容量
        String targetStatus = registeredCount >= capacity ? "PENDING" : "REGISTERED";
        
        // 检查是否存在已取消的记录，如果存在则复用，否则新建
        MatchRegistration existingReg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId));
        
        if (existingReg != null) {
            // 复用已有记录，更新状态
            existingReg.setStatus(targetStatus);
            existingReg.setGroupIndex(null);
            existingReg.setPaymentStatus("UNPAID");
            registrationService.updateById(existingReg);
        } else {
            // 新建记录
            MatchRegistration reg = new MatchRegistration();
            reg.setMatchId(matchId);
            reg.setPlayerId(playerId);
            reg.setStatus(targetStatus);
            reg.setIsExempt(false);
            registrationService.save(reg);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelRegistration(Long matchId, Long playerId) {
        Match match = this.getById(matchId);
        MatchRegistration reg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .in(MatchRegistration::getStatus, "REGISTERED", "PENDING"));

        if (reg == null) return;

        // PENDING 状态取消时，直接变为 CANCELLED（无需付费）
        if ("PENDING".equals(reg.getStatus())) {
            reg.setStatus("CANCELLED");
        } else if (LocalDateTime.now().isAfter(match.getCancelDeadline())) {
            reg.setStatus("NO_SHOW");
        } else {
            reg.setStatus("CANCELLED");
        }
        registrationService.updateById(reg);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void approveRegistration(Long matchId, Long playerId) {
        MatchRegistration reg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .eq(MatchRegistration::getStatus, "PENDING"));
        
        if (reg == null) throw new IllegalArgumentException("未找到待审批的报名记录");
        
        reg.setStatus("REGISTERED");
        registrationService.updateById(reg);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void rejectRegistration(Long matchId, Long playerId) {
        MatchRegistration reg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .eq(MatchRegistration::getStatus, "PENDING"));
        
        if (reg == null) throw new IllegalArgumentException("未找到待审批的报名记录");
        
        reg.setStatus("CANCELLED");
        registrationService.updateById(reg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GroupsVO confirmAndGroup(Long matchId, GroupingRequest request) {
        Match match = this.getById(matchId);

        String currentStatus = match.getStatus();
        if (Match.STATUS_ONGOING.equals(currentStatus) ||
            Match.STATUS_SETTLED.equals(currentStatus) ||
            Match.STATUS_MATCH_FINISHED.equals(currentStatus)) {
            throw new IllegalStateException("当前状态不允许重新分组");
        }

        List<MatchRegistration> validRegs = registrationService.getValidRegistrations(matchId);

        List<Long> playerIdsToAssign;
        if (request.isKeepExisting()) {
            playerIdsToAssign = validRegs.stream()
                    .filter(r -> r.getGroupIndex() == null)
                    .map(MatchRegistration::getPlayerId)
                    .collect(Collectors.toList());
        } else {
            playerIdsToAssign = validRegs.stream()
                    .map(MatchRegistration::getPlayerId)
                    .collect(Collectors.toList());
        }

        String strategyName = request.getStrategyName();
        GroupingStrategy strategy = (strategyName != null && !strategyName.isEmpty())
                ? strategyFactory.getStrategy(strategyName)
                : strategyFactory.getDefaultStrategy();

        Map<Integer, List<Long>> allocation = strategy.allocate(playerIdsToAssign, match.getNumGroups(), new HashMap<>());

        if (request.isKeepExisting()) {
            persistGroupAssignmentsPartial(matchId, allocation);
        } else {
            persistGroupAssignments(matchId, allocation);
        }

        match.setGroupsPublished(false);
        this.updateById(match);

        return buildGroupsVO(matchId, false);
    }

    @Override
    public List<String> listGroupingStrategies() {
        return strategyFactory.listStrategyNames();
    }

    @Override
    public GroupsVO getGroups(Long matchId, boolean isAdmin) {
        Match match = this.getById(matchId);
        // 分组数据在 PUBLISHED 之后任意状态下均可能存在
        String status = match.getStatus();
        boolean groupingRelevant = Match.STATUS_PUBLISHED.equals(status)
                || Match.STATUS_REGISTRATION_CLOSED.equals(status)
                || Match.STATUS_GROUPING_DRAFT.equals(status)
                || Match.STATUS_ONGOING.equals(status)
                || Match.STATUS_MATCH_FINISHED.equals(status)
                || Match.STATUS_SETTLED.equals(status);

        if (!groupingRelevant) {
            return null;
        }
        boolean published = Boolean.TRUE.equals(match.getGroupsPublished());
        if (!isAdmin && !published) {
            return null;
        }
        return buildGroupsVO(matchId, published);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void publishGroups(Long matchId) {
        Match match = this.getById(matchId);
        String status = match.getStatus();
        if (!Match.STATUS_PUBLISHED.equals(status) && !Match.STATUS_REGISTRATION_CLOSED.equals(status)) {
            throw new IllegalStateException("只有 PUBLISHED 或 REGISTRATION_CLOSED 状态下才能发布分组");
        }

        match.setGroupsPublished(true);
        this.updateById(match);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void startMatch(Long matchId, LocalDateTime actualStartTime) {
        Match match = this.getById(matchId);
        
        if (!Match.STATUS_REGISTRATION_CLOSED.equals(match.getStatus()) 
                && !Match.STATUS_GROUPING_DRAFT.equals(match.getStatus())) {
            throw new IllegalStateException("只有报名截止或分组草稿状态下才能开赛");
        }

        if (actualStartTime == null) {
            throw new IllegalArgumentException("实际开赛时间不能为空");
        }

        if (!Boolean.TRUE.equals(match.getGroupsPublished())) {
            throw new IllegalStateException("分组尚未发布，无法开赛");
        }

        List<MatchRegistration> allRegs = registrationService.getValidRegistrations(matchId);
        
        if (allRegs.size() < match.getNumGroups()) {
            throw new IllegalStateException(String.format("报名人数（%d）少于分组数量（%d），无法开赛", 
                    allRegs.size(), match.getNumGroups()));
        }

        boolean allAssigned = allRegs.stream().allMatch(r -> r.getGroupIndex() != null);
        if (!allAssigned) {
            throw new IllegalStateException("尚有球员未分配到组，无法开赛");
        }

        Map<Integer, Long> groupCounts = allRegs.stream()
                .filter(r -> r.getGroupIndex() != null)
                .collect(Collectors.groupingBy(MatchRegistration::getGroupIndex, Collectors.counting()));
        
        for (int i = 0; i < match.getNumGroups(); i++) {
            Long count = groupCounts.getOrDefault(i, 0L);
            if (count == 0) {
                throw new IllegalStateException(String.format("第 %d 组没有球员，无法开赛", i));
            }
        }

        List<Long> allParticipantIds = allRegs.stream().map(MatchRegistration::getPlayerId).collect(Collectors.toList());

        if (CollUtil.isNotEmpty(allParticipantIds)) {
            playerService.update(new LambdaUpdateWrapper<Player>()
                    .in(Player::getId, allParticipantIds)
                    .set(Player::getLastMatchTime, LocalDateTime.now()));
        }

        generateRoundRobinGames(match);
        match.setStatus(Match.STATUS_ONGOING);
        match.setActualStartTime(actualStartTime);
        this.updateById(match);
        sseManager.broadcastToClub(match.getTournamentId(), "match_started", match.getTitle() + " 比赛开始！");
    }

    private void persistGroupAssignments(Long matchId, Map<Integer, List<Long>> allocation) {
        registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .set(MatchRegistration::getGroupIndex, null));

        for (Map.Entry<Integer, List<Long>> entry : allocation.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Long playerId : entry.getValue()) {
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }
    }

    private void persistGroupAssignmentsPartial(Long matchId, Map<Integer, List<Long>> allocation) {
        for (Map.Entry<Integer, List<Long>> entry : allocation.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Long playerId : entry.getValue()) {
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }
    }

    private GroupsVO buildGroupsVO(Long matchId, boolean published) {
        Match match = getById(matchId);
        List<MatchRegistration> allRegs = registrationService.getValidRegistrations(matchId);
        List<Long> allPlayerIds = allRegs.stream().map(MatchRegistration::getPlayerId).collect(Collectors.toList());
        Map<Long, Player> playerMap = CollUtil.isEmpty(allPlayerIds)
                ? new HashMap<>()
                : playerService.listByIds(allPlayerIds).stream().collect(Collectors.toMap(Player::getId, p -> p));

        Map<Integer, List<GroupsVO.PlayerItem>> groups = new HashMap<>();
        List<GroupsVO.PlayerItem> unassigned = new ArrayList<>();

        for (MatchRegistration reg : allRegs) {
            Player player = playerMap.get(reg.getPlayerId());
            GroupsVO.PlayerItem item = new GroupsVO.PlayerItem();
            item.setId(reg.getPlayerId());
            item.setName(player != null ? player.getNickname() : "球员#" + reg.getPlayerId());
            item.setRating(player != null ? player.getRating() : new BigDecimal("5.0"));

            if (reg.getGroupIndex() != null) {
                groups.computeIfAbsent(reg.getGroupIndex(), k -> new ArrayList<>()).add(item);
            } else {
                unassigned.add(item);
            }
        }

        GroupsVO vo = new GroupsVO();
        vo.setGroupsPublished(published);
        vo.setGroups(groups);
        vo.setUnassigned(unassigned);
        vo.setTeamNames(match != null ? match.getTeamNames() : null);
        return vo;
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateTeamName(Long matchId, Integer groupIndex, String name) {
        Match match = this.getById(matchId);
        String status = match.getStatus();
        if (!Match.STATUS_PUBLISHED.equals(status)
                && !Match.STATUS_REGISTRATION_CLOSED.equals(status)
                && !Match.STATUS_ONGOING.equals(status)
                && !Match.STATUS_MATCH_FINISHED.equals(status)) {
            throw new IllegalStateException("当前状态不允许修改队伍名称");
        }
        Map<Integer, String> teamNames = match.getTeamNames();
        if (teamNames == null) {
            teamNames = new HashMap<>();
        }
        if (name == null || name.trim().isEmpty()) {
            teamNames.remove(groupIndex);
        } else {
            teamNames.put(groupIndex, name.trim());
        }
        match.setTeamNames(teamNames);
        this.updateById(match);
    }

    private void generateRoundRobinGames(Match match) {
        int n = match.getNumGroups();
        int plannedCount = (match.getPlannedGameCount() != null && match.getPlannedGameCount() > 0) 
                           ? match.getPlannedGameCount() 
                           : (n * (n - 1) / 2); // 默认单循环
        
        // 1. 生成所有可能的对阵组合 (单循环池)
        List<int[]> pool = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                pool.add(new int[]{i, j});
            }
        }

        if (pool.isEmpty()) return;

        // 2. 按 plannedCount 生成场次
        for (int k = 0; k < plannedCount; k++) {
            // 循环使用对阵池中的组合
            int[] pair = pool.get(k % pool.size());
            
            MatchGame game = new MatchGame();
            game.setMatchId(match.getId());
            game.setTeamAIndex(pair[0]);
            game.setTeamBIndex(pair[1]);
            game.setStatus("READY");
            game.setGameIndex(k);
            gameService.save(game);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishMatch(Long matchId) {
        Match match = this.getById(matchId);
        match.setStatus(Match.STATUS_MATCH_FINISHED);
        this.updateById(match);
        sseManager.broadcastToClub(match.getTournamentId(), "match_finished", match.getTitle() + " 已结束");
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void settleFees(Long matchId) {
        Match match = this.getById(matchId);
        if (!Match.STATUS_MATCH_FINISHED.equals(match.getStatus())) {
            throw new IllegalStateException("只有在 MATCH_FINISHED 状态下才能进行结算");
        }
        List<MatchRegistration> billable = registrationService.list(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .in(MatchRegistration::getStatus, "REGISTERED", "NO_SHOW")
                .eq(MatchRegistration::getIsExempt, false));

        if (CollUtil.isNotEmpty(billable) && match.getTotalCost() != null) {
            BigDecimal count = new BigDecimal(billable.size());
            BigDecimal perPerson = match.getTotalCost().divide(count, 0, RoundingMode.CEILING);
            match.setPerPersonCost(perPerson);
            registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                    .eq(MatchRegistration::getMatchId, matchId)
                    .in(MatchRegistration::getStatus, "REGISTERED", "NO_SHOW")
                    .eq(MatchRegistration::getIsExempt, false)
                    .set(MatchRegistration::getPaymentStatus, "UNPAID"));
        }
        match.setStatus(Match.STATUS_SETTLED);
        this.updateById(match);
        eventPublisher.publishEvent(new com.bottomlord.common.event.MatchSettledEvent(this, match.getId(), match.getTournamentId()));
        sseManager.broadcastToClub(match.getTournamentId(), "match_settled", match.getTitle() + " 费用已结算");
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void adjustGroupsManually(Long matchId, Map<Integer, List<Long>> manualGroups) {
        Match match = this.getById(matchId);
        String status = match.getStatus();
        if (!Match.STATUS_PUBLISHED.equals(status) && !Match.STATUS_REGISTRATION_CLOSED.equals(status)) {
            throw new IllegalStateException("只有 PUBLISHED 或 REGISTRATION_CLOSED 状态下才能调整分组");
        }

        Set<Long> assignedPlayerIds = manualGroups.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toCollection(HashSet::new));

        if (!assignedPlayerIds.isEmpty()) {
            registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                    .eq(MatchRegistration::getMatchId, matchId)
                    .notIn(MatchRegistration::getPlayerId, assignedPlayerIds)
                    .set(MatchRegistration::getGroupIndex, null));
        } else {
            registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                    .eq(MatchRegistration::getMatchId, matchId)
                    .set(MatchRegistration::getGroupIndex, null));
        }

        for (Map.Entry<Integer, List<Long>> entry : manualGroups.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Long playerId : entry.getValue()) {
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void rollbackMatchStatus(Long matchId, String targetStatus) {
        Match match = getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (!Match.STATUS_ONGOING.equals(match.getStatus())) {
            throw new IllegalStateException("只能从 ONGOING 状态回退");
        }

        if (!Match.STATUS_REGISTRATION_CLOSED.equals(targetStatus) 
                && !Match.STATUS_GROUPING_DRAFT.equals(targetStatus)) {
            throw new IllegalArgumentException("只能回退到 REGISTRATION_CLOSED 或 GROUPING_DRAFT 状态");
        }

        gameService.remove(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, matchId));

        match.setStatus(targetStatus);
        match.setActualStartTime(null);
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateActualStartTime(Long matchId, LocalDateTime actualStartTime) {
        Match match = getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (!Match.STATUS_ONGOING.equals(match.getStatus())) {
            throw new IllegalStateException("只能修改进行中赛事的开赛时间");
        }

        if (actualStartTime == null) {
            throw new IllegalArgumentException("实际开赛时间不能为空");
        }

        match.setActualStartTime(actualStartTime);
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void softDeleteMatch(Long matchId, Long userId) {
        Match match = getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (match.getDeletedAt() != null) {
            throw new IllegalStateException("赛事已被删除");
        }

        match.setDeletedAt(LocalDateTime.now());
        match.setDeletedBy(userId);
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    public List<Match> listTrashedMatches() {
        return this.list(new LambdaQueryWrapper<Match>()
                .isNotNull(Match::getDeletedAt)
                .orderByDesc(Match::getDeletedAt));
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void permanentDeleteMatch(Long matchId) {
        Match match = this.getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (match.getDeletedAt() == null) {
            throw new IllegalStateException("只能物理删除已软删除的赛事");
        }

        registrationService.remove(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId));

        List<MatchGame> games = gameService.list(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, matchId));
        
        if (CollUtil.isNotEmpty(games)) {
            List<Long> gameIds = games.stream().map(MatchGame::getId).collect(Collectors.toList());
            
            matchGoalMapper.delete(new LambdaQueryWrapper<MatchGoal>()
                    .in(MatchGoal::getGameId, gameIds));

            gameParticipantMapper.delete(new LambdaQueryWrapper<GameParticipant>()
                    .in(GameParticipant::getGameId, gameIds));

            matchScoreLogMapper.delete(new LambdaQueryWrapper<MatchScoreLog>()
                    .in(MatchScoreLog::getGameId, gameIds));
        }

        gameService.remove(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, matchId));

        playerMutualRatingMapper.delete(new LambdaQueryWrapper<PlayerMutualRating>()
                .eq(PlayerMutualRating::getMatchId, matchId));

        this.removeById(matchId);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void restoreMatch(Long matchId) {
        Match match = getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (match.getDeletedAt() == null) {
            throw new IllegalStateException("赛事未被删除，无需恢复");
        }

        match.setDeletedAt(null);
        match.setDeletedBy(null);
        this.updateById(match);
    }

    @Override
    @RequiresRoles("admin")
    public List<Player> getEligiblePlayers(Long matchId) {
        Match match = this.getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        List<Player> allPlayers = playerService.list(new LambdaQueryWrapper<Player>()
                .eq(Player::getTournamentId, match.getTournamentId())
                .eq(Player::getStatus, 1));

        Set<Long> registeredPlayerIds = registrationService.list(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .in(MatchRegistration::getStatus, "REGISTERED", "PENDING"))
                .stream()
                .map(MatchRegistration::getPlayerId)
                .collect(Collectors.toSet());

        return allPlayers.stream()
                .filter(p -> !registeredPlayerIds.contains(p.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void adminAddPlayer(Long matchId, Long playerId) {
        Match match = this.getById(matchId);
        if (match == null) {
            throw new IllegalArgumentException("赛事不存在");
        }

        if (!Match.STATUS_PUBLISHED.equals(match.getStatus()) 
                && !Match.STATUS_REGISTRATION_CLOSED.equals(match.getStatus())) {
            throw new IllegalStateException("只有在报名中或报名截止状态下才能手动添加球员");
        }

        long existingCount = registrationService.count(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .in(MatchRegistration::getStatus, "REGISTERED", "PENDING"));

        if (existingCount > 0) {
            throw new IllegalStateException("该球员已报名此赛事");
        }

        MatchRegistration existingReg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId));

        if (existingReg != null) {
            existingReg.setStatus("REGISTERED");
            existingReg.setGroupIndex(null);
            existingReg.setPaymentStatus("UNPAID");
            registrationService.updateById(existingReg);
        } else {
            MatchRegistration reg = new MatchRegistration();
            reg.setMatchId(matchId);
            reg.setPlayerId(playerId);
            reg.setStatus("REGISTERED");
            reg.setIsExempt(false);
            registrationService.save(reg);
        }
    }
}
