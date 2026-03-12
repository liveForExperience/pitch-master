package com.bottomlord.strategy.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.RandomUtil;
import com.bottomlord.entity.Player;
import com.bottomlord.service.PlayerService;
import com.bottomlord.strategy.GroupingStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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

    @Override
    public Map<Integer, List<Long>> allocate(List<Long> playerIds, int groupCount, Map<String, Object> constraints) {
        if (CollUtil.isEmpty(playerIds)) {
            return Collections.emptyMap();
        }

        // 1. 获取球员详细信息并处理默认分值
        List<Player> players = playerService.listByIds(playerIds);
        
        // 2. 补全缺失球员信息（处理新球员）并排序
        // 规则：按 Rating 降序，Rating 相同时通过随机数打乱
        List<Player> sortedPlayers = players.stream()
                .peek(p -> {
                    if (p.getRating() == null) {
                        p.setRating(new BigDecimal("5.0"));
                    }
                })
                .sorted(Comparator.comparing(Player::getRating).reversed()
                        .thenComparing(p -> RandomUtil.randomInt())) // 随机化相同分数的顺序
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
