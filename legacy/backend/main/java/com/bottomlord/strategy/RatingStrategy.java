package com.bottomlord.strategy;

import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.Player;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 评分算法策略接口
 */
public interface RatingStrategy {
    
    /**
     * 根据单场比赛结果计算分值变动
     * @param game 场次信息（含比分）
     * @param teamAPlayers 队A球员列表
     * @param teamBPlayers 队B球员列表
     * @return 球员ID与评分变动值的映射
     */
    Map<Long, BigDecimal> calculateRatingChanges(MatchGame game, List<Player> teamAPlayers, List<Player> teamBPlayers);
}
