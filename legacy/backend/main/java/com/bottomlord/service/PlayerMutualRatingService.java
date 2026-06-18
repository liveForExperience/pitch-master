package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.PlayerMutualRating;
import java.math.BigDecimal;
import java.util.Map;

public interface PlayerMutualRatingService extends IService<PlayerMutualRating> {

    /**
     * 提交互评
     * @param rating 互评实体
     * @param quickTotalScore 如果非空，则将所有维度同步为此总分 (支持 UI 一键评分)
     */
    void submitRating(PlayerMutualRating rating, BigDecimal quickTotalScore);

    /**
     * 统计某场比赛的 MVP 票数
     * @param matchId 比赛ID
     * @return 球员ID与票数的映射
     */
    Map<Long, Integer> countMvpVotes(Long matchId);

    /**
     * 确定本场比赛的最终 MVP
     * @param matchId 比赛ID
     * @param manualPlayerId 如果管理员手动指定，则使用此ID；否则自动选票数最高者
     */
    void finalizeMvp(Long matchId, Long manualPlayerId);
}
