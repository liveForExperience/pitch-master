package com.bottomlord.service.impl;

import com.bottomlord.common.event.MatchSettledEvent;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.Player;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchGoalService;
import com.bottomlord.service.MatchRegistrationService;
import com.bottomlord.service.PlayerService;
import com.bottomlord.service.RatingService;
import com.bottomlord.strategy.RatingStrategy;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 评分系统处理器实现 (集成 ELO 算法)
 */
@Service
@Slf4j
public class RatingServiceImpl implements RatingService {

    @Autowired
    private MatchGameService gameService;

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private PlayerService playerService;

    @Autowired
    private MatchGoalService goalService;

    @Autowired
    private RatingStrategy ratingStrategy;

    private static final BigDecimal GOAL_BONUS = new BigDecimal("0.02");
    private static final BigDecimal ASSIST_BONUS = new BigDecimal("0.01");

    @Override
    @EventListener
    @Transactional(rollbackFor = Exception.class)
    public void handleMatchSettled(MatchSettledEvent event) {
        log.info("开始处理赛事 ELO 评分更新: matchId={}", event.getMatchId());

        // 1. 获取该比赛下所有的场次记录 (已完成的)
        List<MatchGame> games = gameService.list(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, event.getMatchId())
                .eq(MatchGame::getStatus, "FINISHED"));

        if (games.isEmpty()) {
            log.warn("未找到已结束的场次，跳过评分更新。");
            return;
        }

        // 2. 获取所有的有效报名人员及其分组信息
        List<MatchRegistration> registrations = registrationService.list(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, event.getMatchId())
                .isNotNull(MatchRegistration::getGroupIndex));

        Map<Long, Integer> playerGroupMap = registrations.stream()
                .collect(Collectors.toMap(MatchRegistration::getPlayerId, MatchRegistration::getGroupIndex));

        // 3. 累计本赛中所有球员的评分变动
        Map<Long, BigDecimal> totalChanges = new HashMap<>();

        for (MatchGame game : games) {
            // 获取两队球员实体
            List<Player> teamA = getPlayersInGroup(playerGroupMap, game.getTeamAIndex());
            List<Player> teamB = getPlayersInGroup(playerGroupMap, game.getTeamBIndex());

            if (teamA.isEmpty() || teamB.isEmpty()) continue;

            // A. 调用 ELO 策略计算 (团队胜负)
            Map<Long, BigDecimal> gameChanges = ratingStrategy.calculateRatingChanges(game, teamA, teamB);
            gameChanges.forEach((pid, delta) -> totalChanges.merge(pid, delta, BigDecimal::add));

            // B. 计算个人表现奖金 (进球与助攻)
            List<com.bottomlord.entity.MatchGoal> goals = goalService.list(new LambdaQueryWrapper<com.bottomlord.entity.MatchGoal>()
                    .eq(com.bottomlord.entity.MatchGoal::getGameId, game.getId()));
            
            for (com.bottomlord.entity.MatchGoal goal : goals) {
                if (goal.getScorerId() != null) {
                    totalChanges.merge(goal.getScorerId(), GOAL_BONUS, BigDecimal::add);
                }
                if (goal.getAssistantId() != null) {
                    totalChanges.merge(goal.getAssistantId(), ASSIST_BONUS, BigDecimal::add);
                }
            }
        }

        // 4. 持久化评分更新
        totalChanges.forEach((playerId, totalDelta) -> {
            Player player = playerService.getById(playerId);
            if (player != null) {
                BigDecimal oldRating = player.getRating() != null ? player.getRating() : new BigDecimal("5.0");
                BigDecimal newRating = oldRating.add(totalDelta).setScale(2, RoundingMode.HALF_UP);
                
                // 限制评分区间在 1.0 - 10.0
                if (newRating.compareTo(new BigDecimal("10.0")) > 0) newRating = new BigDecimal("10.00");
                if (newRating.compareTo(new BigDecimal("1.0")) < 0) newRating = new BigDecimal("1.00");

                player.setRating(newRating);
                playerService.updateById(player);
                log.info("球员 {} ELO评分更新: {} -> {} (变动: {})", 
                    player.getNickname(), oldRating, newRating, totalDelta);
            }
        });
    }

    private List<Player> getPlayersInGroup(Map<Long, Integer> playerGroupMap, Integer groupIndex) {
        List<Long> pids = playerGroupMap.entrySet().stream()
                .filter(e -> e.getValue().equals(groupIndex))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        if (pids.isEmpty()) return List.of();
        return playerService.listByIds(pids);
    }
}
