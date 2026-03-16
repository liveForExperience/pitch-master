package com.bottomlord.strategy.rating;

import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingHistory;
import java.math.BigDecimal;
import java.util.Map;

/**
 * 评分策略接口
 */
public interface RatingStrategy {
    
    /**
     * 计算单场比赛后的评分变动
     * @param player 球员实体
     * @param matchContext 比赛上下文数据（胜负、进球、对手评分等）
     * @return 评分变动记录
     */
    PlayerRatingHistory calculate(Player player, Map<String, Object> matchContext);
    
    /**
     * 策略名称 (如: ELO, GLICKO_2)
     */
    String getStrategyName();
}