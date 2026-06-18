package com.bottomlord.strategy.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.service.PlayerService;
import com.bottomlord.strategy.GroupingStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 简单实力平衡策略 (基于技术分 Rating)
 * <p>
 * 逻辑：蛇形分组 (Snake Draft)，相同评分随机排序。
 * </p>
 *
 * @author Gemini
 */
@Component
public class SimpleSkillBalanceStrategy implements GroupingStrategy {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @Override
    public Map<Integer, List<Long>> allocate(List<Long> playerIds, int groupCount, Map<String, Object> constraints) {
        if (CollUtil.isEmpty(playerIds)) {
            return Collections.emptyMap();
        }

        // 1. 获取球员详细信息
        List<Player> players = playerService.listByIds(playerIds);

        // 2. 从 player_rating_profile 加载 tournament 维度评分（三维加权总分）
        Object tidObj = constraints != null ? constraints.get("tournamentId") : null;
        if (tidObj != null) {
            Long tournamentId = ((Number) tidObj).longValue();
            List<PlayerRatingProfile> profiles = playerRatingProfileMapper.selectList(
                    new LambdaQueryWrapper<PlayerRatingProfile>()
                            .in(PlayerRatingProfile::getPlayerId, playerIds)
                            .eq(PlayerRatingProfile::getTournamentId, tournamentId));
            Map<Long, BigDecimal> ratingMap = new HashMap<>();
            profiles.forEach(p -> {
                BigDecimal s = p.getSkillRating() != null ? p.getSkillRating() : new BigDecimal("5.00");
                BigDecimal perf = p.getPerformanceRating() != null ? p.getPerformanceRating() : new BigDecimal("5.00");
                BigDecimal eng = p.getEngagementRating() != null ? p.getEngagementRating() : new BigDecimal("5.00");
                ratingMap.put(p.getPlayerId(), s.multiply(new BigDecimal("0.40"))
                        .add(perf.multiply(new BigDecimal("0.40")))
                        .add(eng.multiply(new BigDecimal("0.20")))
                        .setScale(2, RoundingMode.HALF_UP));
            });
            players.forEach(p -> p.setRating(ratingMap.getOrDefault(p.getId(), new BigDecimal("5.00"))));
        } else {
            players.forEach(p -> { if (p.getRating() == null) p.setRating(new BigDecimal("5.00")); });
        }

        // 3. 按 Rating 降序排序，相同分数随机打乱
        List<Player> sortedPlayers = players.stream()
                .sorted(Comparator.comparing(Player::getRating).reversed()
                        .thenComparing(p -> RandomUtil.randomInt()))
                .collect(Collectors.toList());

        // 3. 执行蛇形分配 (Snake Distribution)
        Map<Integer, List<Long>> result = new HashMap<>(groupCount);
        for (int i = 0; i < groupCount; i++) {
            result.put(i, new ArrayList<>());
        }

        boolean forward = true;
        int currentGroup = 0;

        for (Player player : sortedPlayers) {
            result.get(currentGroup).add(player.getId());

            if (forward) {
                if (currentGroup < groupCount - 1) {
                    currentGroup++;
                } else {
                    forward = false; // 触达边界，折返
                }
            } else {
                if (currentGroup > 0) {
                    currentGroup--;
                } else {
                    forward = true; // 触达边界，折返
                }
            }
        }

        return result;
    }

    @Override
    public String getStrategyName() {
        return "SIMPLE_SKILL_BALANCE";
    }
}
