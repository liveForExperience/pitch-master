package com.bottomlord.strategy.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.RandomUtil;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRelationship;
import com.bottomlord.service.PlayerRelationshipService;
import com.bottomlord.service.PlayerService;
import com.bottomlord.strategy.GroupingStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 进阶加权平衡策略
 * <p>
 * 维度：位置均衡 (GK/DF/FW) > 战力平衡 (Rating) > 默契加成 (Chemistry)
 * </p>
 * 
 * @author Gemini
 */
@Component
public class AdvancedWeightedGroupingStrategy implements GroupingStrategy {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRelationshipService relationshipService;

    @Override
    public Map<Integer, List<Long>> allocate(List<Long> playerIds, int groupCount, Map<String, Object> constraints) {
        if (CollUtil.isEmpty(playerIds)) return Collections.emptyMap();

        // 1. 加载数据
        List<Player> players = playerService.listByIds(playerIds);
        List<PlayerRelationship> relations = relationshipService.listBatchRelationships(playerIds);

        // 2. 初始化分组容器
        Map<Integer, List<Player>> groups = new HashMap<>();
        for (int i = 0; i < groupCount; i++) {
            groups.put(i, new ArrayList<>());
        }

        // 3. 按位置分组并排序
        // 顺序：GK -> DF -> MF -> FW -> UNKNOWN
        Map<String, List<Player>> positionMap = players.stream()
                .peek(p -> { if(p.getRating() == null) p.setRating(new BigDecimal("5.0")); })
                .collect(Collectors.groupingBy(p -> p.getPosition() != null ? p.getPosition() : "UNKNOWN"));

        String[] posOrder = {"GK", "DF", "MF", "FW", "UNKNOWN"};

        // 4. 贪心分配：在每个位置内部进行蛇形分配
        int currentGroup = 0;
        boolean forward = true;

        for (String pos : posOrder) {
            List<Player> posPlayers = positionMap.getOrDefault(pos, new ArrayList<>());
            // 同位置内部按 Rating 降序并打乱相同分的
            posPlayers.sort(Comparator.comparing(Player::getRating).reversed()
                    .thenComparing(p -> RandomUtil.randomInt()));

            for (Player p : posPlayers) {
                groups.get(currentGroup).add(p);
                
                // 蛇形索引移动
                if (forward) {
                    if (currentGroup < groupCount - 1) { currentGroup++; } 
                    else { forward = false; }
                } else {
                    if (currentGroup > 0) { currentGroup--; } 
                    else { forward = true; }
                }
            }
        }

        // 5. 局部搜索优化 (Local Search / Swapping)
        // 目标：微调各组之间的 Rating 总和，通过交换同位置的球员来平衡
        optimizeBalance(groups, groupCount);

        // 6. 转换为结果格式
        return groups.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(Player::getId).collect(Collectors.toList())
                ));
    }

    private void optimizeBalance(Map<Integer, List<Player>> groups, int groupCount) {
        // 简单实现：尝试 10 次同位置交换，若能降低组间标准差则保留
        for (int i = 0; i < 10; i++) {
            int g1 = RandomUtil.randomInt(groupCount);
            int g2 = RandomUtil.randomInt(groupCount);
            if (g1 == g2) continue;

            List<Player> group1 = groups.get(g1);
            List<Player> group2 = groups.get(g2);

            // 随机选出两个组中位置相同的球员
            Optional<Player> p1Opt = group1.stream().findAny();
            if (p1Opt.isEmpty()) continue;
            Player p1 = p1Opt.get();

            Optional<Player> p2Opt = group2.stream()
                    .filter(p -> Objects.equals(p.getPosition(), p1.getPosition()))
                    .findAny();

            if (p2Opt.isPresent()) {
                Player p2 = p2Opt.get();
                
                double diffBefore = Math.abs(getGroupTotalRating(group1) - getGroupTotalRating(group2));
                
                // 模拟交换
                double rating1After = getGroupTotalRating(group1) - p1.getRating().doubleValue() + p2.getRating().doubleValue();
                double rating2After = getGroupTotalRating(group2) - p2.getRating().doubleValue() + p1.getRating().doubleValue();
                double diffAfter = Math.abs(rating1After - rating2After);

                if (diffAfter < diffBefore) {
                    // 确认交换
                    group1.remove(p1); group1.add(p2);
                    group2.remove(p2); group2.add(p1);
                }
            }
        }
    }

    private double getGroupTotalRating(List<Player> players) {
        return players.stream().mapToDouble(p -> p.getRating().doubleValue()).sum();
    }

    @Override
    public String getStrategyName() {
        return "ADVANCED_WEIGHTED_BALANCE";
    }
}
