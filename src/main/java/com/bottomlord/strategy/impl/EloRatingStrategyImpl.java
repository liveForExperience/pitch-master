package com.bottomlord.strategy.impl;

import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.Player;
import com.bottomlord.strategy.RatingStrategy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ELO 评分系统实现
 * 适配团队运动 (Football)
 */
@Component
public class EloRatingStrategyImpl implements RatingStrategy {

    // K因子：决定了单场比赛的最大分值变动（对于 1-10 分制，设为 0.5 较为适中）
    private static final BigDecimal K_FACTOR = new BigDecimal("0.5");
    private static final BigDecimal SCALE = new BigDecimal("4.0"); // 对应 ELO 公式中的 400 (缩放到 1-10 分制)

    @Override
    public Map<Long, BigDecimal> calculateRatingChanges(MatchGame game, List<Player> teamAPlayers, List<Player> teamBPlayers) {
        Map<Long, BigDecimal> changes = new HashMap<>();

        // 1. 计算两队平均评分
        BigDecimal avgRA = calculateAverageRating(teamAPlayers);
        BigDecimal avgRB = calculateAverageRating(teamBPlayers);

        // 2. 计算胜率期望值 EA = 1 / (1 + 10^((RB-RA)/SCALE))
        double exponent = avgRB.subtract(avgRA).divide(SCALE, 4, RoundingMode.HALF_UP).doubleValue();
        double expectedA = 1.0 / (1.0 + Math.pow(10, exponent));
        double expectedB = 1.0 - expectedA;

        // 3. 计算实际得分 S (胜=1, 平=0.5, 负=0)
        double scoreA, scoreB;
        if (game.getScoreA() > game.getScoreB()) {
            scoreA = 1.0; scoreB = 0.0;
        } else if (game.getScoreA() < game.getScoreB()) {
            scoreA = 0.0; scoreB = 1.0;
        } else {
            scoreA = 0.5; scoreB = 0.5;
        }

        // 4. 计算分值变动 ΔR = K * (S - E)
        BigDecimal changeA = K_FACTOR.multiply(BigDecimal.valueOf(scoreA - expectedA));
        BigDecimal changeB = K_FACTOR.multiply(BigDecimal.valueOf(scoreB - expectedB));

        // 5. 分配变动到每个球员 (如果希望引入进球加分，可以在此处叠加)
        teamAPlayers.forEach(p -> changes.put(p.getId(), changeA));
        teamBPlayers.forEach(p -> changes.put(p.getId(), changeB));

        return changes;
    }

    private BigDecimal calculateAverageRating(List<Player> players) {
        if (players.isEmpty()) return new BigDecimal("5.0");
        BigDecimal sum = players.stream()
                .map(p -> p.getRating() != null ? p.getRating() : new BigDecimal("5.0"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(new BigDecimal(players.size()), 4, RoundingMode.HALF_UP);
    }
}
