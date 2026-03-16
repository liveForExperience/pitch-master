package com.bottomlord.service;

import com.bottomlord.entity.MatchGame;
import java.time.LocalDateTime;

/**
 * 核心评分计算服务 (CPI Pipeline)
 */
public interface RatingService {
    
    /**
     * 结算单场 Game 后的所有评分与统计变动
     */
    void settleGameRating(Long gameId);
    
    /**
     * 计算并更新评分衰减 (定时任务调用)
     */
    void processRatingDecay();

    void processRatingDecay(LocalDateTime atTime);
}