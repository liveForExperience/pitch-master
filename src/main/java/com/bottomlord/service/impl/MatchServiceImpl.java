package com.bottomlord.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.common.util.SseManager;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.Player;
import com.bottomlord.mapper.MatchMapper;
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
import java.util.List;
import java.util.Map;
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

    @Override
    public List<Match> listUpcomingMatches() {
        boolean isAdmin = SecurityUtils.getSubject().hasRole("admin");
        LambdaQueryWrapper<Match> wrapper = new LambdaQueryWrapper<Match>()
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

        // 核心动态逻辑：判断当前是否允许报名
        if (!Match.STATUS_PUBLISHED.equals(match.getStatus())) {
            throw new IllegalStateException("当前赛事未开放报名");
        }
        
        // 检查时间：如果已过截止时间，尝试自动切换状态并报错
        if (LocalDateTime.now().isAfter(match.getRegistrationDeadline())) {
            match.setStatus(Match.STATUS_REGISTRATION_CLOSED);
            this.updateById(match);
            throw new IllegalStateException("报名已截止");
        }

        long count = registrationService.count(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .ne(MatchRegistration::getStatus, "CANCELLED"));
        
        if (count > 0) throw new IllegalStateException("已报名该赛事");

        MatchRegistration reg = new MatchRegistration();
        reg.setMatchId(matchId);
        reg.setPlayerId(playerId);
        reg.setStatus("REGISTERED");
        reg.setIsExempt(false);
        registrationService.save(reg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelRegistration(Long matchId, Long playerId) {
        Match match = this.getById(matchId);
        MatchRegistration reg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .eq(MatchRegistration::getStatus, "REGISTERED"));

        if (reg == null) return;

        if (LocalDateTime.now().isAfter(match.getCancelDeadline())) {
            reg.setStatus("NO_SHOW");
        } else {
            reg.setStatus("CANCELLED");
        }
        registrationService.updateById(reg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<Integer, List<Long>> confirmAndGroup(Long matchId) {
        Match match = this.getById(matchId);
        
        // 只要不是已经开赛或结算，允许强制进入分组阶段（含从 PUBLISHED 提前进入）
        String currentStatus = match.getStatus();
        if (Match.STATUS_ONGOING.equals(currentStatus) || 
            Match.STATUS_SETTLED.equals(currentStatus) || 
            Match.STATUS_MATCH_FINISHED.equals(currentStatus)) {
            throw new IllegalStateException("当前状态不允许重新分组");
        }

        List<MatchRegistration> validRegs = registrationService.getValidRegistrations(matchId);
        List<Long> playerIds = validRegs.stream().map(MatchRegistration::getPlayerId).collect(Collectors.toList());
        
        GroupingStrategy strategy = strategyFactory.getDefaultStrategy();
        Map<Integer, List<Long>> allocation = strategy.allocate(playerIds, match.getNumGroups(), new HashMap<>());

        match.setStatus(Match.STATUS_GROUPING_DRAFT);
        this.updateById(match);
        return allocation;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void startWithGroups(Long matchId, Map<Integer, List<Long>> finalGroups) {
        Match match = this.getById(matchId);
        List<Long> allParticipantIds = new ArrayList<>();

        for (Map.Entry<Integer, List<Long>> entry : finalGroups.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Object playerIdObj : entry.getValue()) {
                Long playerId = Long.valueOf(playerIdObj.toString());
                allParticipantIds.add(playerId);
                
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }

        // 更新球员的“最后参赛时间”
        if (CollUtil.isNotEmpty(allParticipantIds)) {
            playerService.update(new LambdaUpdateWrapper<Player>()
                    .in(Player::getId, allParticipantIds)
                    .set(Player::getLastMatchTime, LocalDateTime.now()));
        }

        generateRoundRobinGames(match);
        match.setStatus(Match.STATUS_ONGOING);
        this.updateById(match);
        sseManager.broadcastToClub(match.getTournamentId(), "match_started", match.getTitle() + " 比赛开始！");
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
}
