package com.bottomlord.service;

import com.bottomlord.common.event.MatchSettledEvent;
import org.springframework.context.event.EventListener;

/**
 * 球员评分演进服务 (脚手架)
 * 职责：监听结算事件，计算并更新球员能力分。
 */
public interface RatingService {
    
    /**
     * 自动处理结算后的评分更新
     */
    @EventListener
    void handleMatchSettled(MatchSettledEvent event);
}
