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
        
        // 构建关系快速索引网 (from -> to -> score)
        Map<Long, Map<Long, Integer>> relationMap = buildRelationMap(relations);

        // 2. 初始化分组容器
        Map<Integer, List<Player>> groups = new HashMap<>();
        for (int i = 0; i < groupCount; i++) {
            groups.put(i, new ArrayList<>());
        }

        // 3. 按位置分组并排序
        Map<String, List<Player>> positionMap = players.stream()
                .peek(p -> { if(p.getRating() == null) p.setRating(new BigDecimal("5.0")); })
                .collect(Collectors.groupingBy(p -> p.getPosition() != null ? p.getPosition() : "UNKNOWN"));

        String[] posOrder = {"GK", "DF", "MF", "FW", "UNKNOWN"};

        // 4. 贪心分配：在每个位置内部进行蛇形分配
        int currentGroup = 0;
        boolean forward = true;

        for (String pos : posOrder) {
            List<Player> posPlayers = positionMap.getOrDefault(pos, new ArrayList<>());
            posPlayers.sort(Comparator.comparing(Player::getRating).reversed()
                    .thenComparing(p -> RandomUtil.randomInt()));

            for (Player p : posPlayers) {
                groups.get(currentGroup).add(p);
                
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
        // 目标：在保持战力平衡的前提下，优化位置重叠处的 Chemistry
        optimizeBalance(groups, groupCount, relationMap);

        // 6. 转换为结果格式
        return groups.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(Player::getId).collect(Collectors.toList())
                ));
    }

    private Map<Long, Map<Long, Integer>> buildRelationMap(List<PlayerRelationship> relations) {
        Map<Long, Map<Long, Integer>> map = new HashMap<>();
        for (PlayerRelationship r : relations) {
            int score = (r.getWillingness() != null ? r.getWillingness() : 0) 
                      + (r.getChemistry() != null ? r.getChemistry() : 0);
            map.computeIfAbsent(r.getFromPlayerId(), k -> new HashMap<>())
               .put(r.getToPlayerId(), score);
        }
        return map;
    }

    private void optimizeBalance(Map<Integer, List<Player>> groups, int groupCount, Map<Long, Map<Long, Integer>> relationMap) {
        // 迭代优化：尝试 50 次同位置交换
        for (int i = 0; i < 50; i++) {
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
                
                double ratingDiffBefore = Math.abs(getGroupTotalRating(group1) - getGroupTotalRating(group2));
                int chemistryTotalBefore = getGroupChemistry(group1, relationMap) + getGroupChemistry(group2, relationMap);

                // 模拟交换后的评分
                double rating1After = getGroupTotalRating(group1) - p1.getRating().doubleValue() + p2.getRating().doubleValue();
                double rating2After = getGroupTotalRating(group2) - p2.getRating().doubleValue() + p1.getRating().doubleValue();
                double ratingDiffAfter = Math.abs(rating1After - rating2After);

                // 模拟交换后的默契度 (这里简化计算，仅计算交换者与组内其他成员的关系变动)
                int chemistry1After = getGroupChemistryAfterSwap(group1, p1, p2, relationMap);
                int chemistry2After = getGroupChemistryAfterSwap(group2, p2, p1, relationMap);
                int chemistryTotalAfter = chemistry1After + chemistry2After;

                // 决策逻辑：
                // 1. 如果交换能减少战力方差且不严重破坏默契度
                // 2. 或者战力方差在可接受范围内（如 < 1.0），且显著提升了默契度
                boolean betterRating = ratingDiffAfter < ratingDiffBefore;
                boolean significantBetterChem = chemistryTotalAfter > chemistryTotalBefore + 2;
                boolean acceptableRating = ratingDiffAfter < 1.5;

                if (betterRating || (acceptableRating && significantBetterChem)) {
                    group1.remove(p1); group1.add(p2);
                    group2.remove(p2); group2.add(p1);
                }
            }
        }
    }

    private int getGroupChemistry(List<Player> group, Map<Long, Map<Long, Integer>> relationMap) {
        int total = 0;
        for (int i = 0; i < group.size(); i++) {
            for (int j = i + 1; j < group.size(); j++) {
                total += getRelationScore(group.get(i).getId(), group.get(j).getId(), relationMap);
                total += getRelationScore(group.get(j).getId(), group.get(i).getId(), relationMap);
            }
        }
        return total;
    }

    private int getGroupChemistryAfterSwap(List<Player> group, Player oldP, Player newP, Map<Long, Map<Long, Integer>> relationMap) {
        int chemistry = getGroupChemistry(group, relationMap);
        // 减去旧球员的关系
        for (Player p : group) {
            if (p.equals(oldP)) continue;
            chemistry -= getRelationScore(oldP.getId(), p.getId(), relationMap);
            chemistry -= getRelationScore(p.getId(), oldP.getId(), relationMap);
        }
        // 加上新球员的关系
        for (Player p : group) {
            if (p.equals(oldP)) continue;
            chemistry += getRelationScore(newP.getId(), p.getId(), relationMap);
            chemistry += getRelationScore(p.getId(), newP.getId(), relationMap);
        }
        return chemistry;
    }

    private int getRelationScore(Long p1, Long p2, Map<Long, Map<Long, Integer>> relationMap) {
        if (relationMap.containsKey(p1)) {
            return relationMap.get(p1).getOrDefault(p2, 0);
        }
        return 0;
    }

    private double getGroupTotalRating(List<Player> players) {
        return players.stream().mapToDouble(p -> p.getRating().doubleValue()).sum();
    }

    @Override
    public String getStrategyName() {
        return "ADVANCED_WEIGHTED_BALANCE";
    }
}
