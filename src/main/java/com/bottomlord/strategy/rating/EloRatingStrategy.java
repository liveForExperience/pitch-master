package com.bottomlord.strategy.rating;

import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingHistory;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 基于 Elo 算法的基础竞技评分策略
 */
@Component("eloRatingStrategy")
public class EloRatingStrategy implements RatingStrategy {

    private static final int K_FACTOR = 32; // 调整系数

    @Override
    public PlayerRatingHistory calculate(Player player, Map<String, Object> context) {
        // 从 context 获取胜负 (win: 1.0, draw: 0.5, loss: 0.0)
        double actualScore = (double) context.getOrDefault("actualScore", 0.5);
        
        // 从 context 获取对手平均评分
        BigDecimal opponentAvgRating = (BigDecimal) context.getOrDefault("opponentAvgRating", BigDecimal.valueOf(1500));
        BigDecimal playerRating = player.getRating() == null ? BigDecimal.valueOf(1500) : player.getRating();
        
        // Elo 核心算法: E = 1 / (1 + 10^((Rb-Ra)/400))
        double exponent = (opponentAvgRating.subtract(playerRating)).doubleValue() / 400.0;
        double expectedScore = 1.0 / (1.0 + Math.pow(10, exponent));
        
        // Delta = K * (Actual - Expected)
        BigDecimal delta = BigDecimal.valueOf(K_FACTOR * (actualScore - expectedScore))
                .setScale(2, RoundingMode.HALF_UP);
        
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(player.getId());
        history.setOldRating(playerRating);
        history.setNewRating(playerRating.add(delta));
        history.setDelta(delta);
        history.setChangeReason("SKILL: ELO");
        history.setCreateTime(LocalDateTime.now());
        
        return history;
    }

    @Override
    public String getStrategyName() {
        return "ELO";
    }
}