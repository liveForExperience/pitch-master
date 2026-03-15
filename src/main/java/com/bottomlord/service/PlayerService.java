package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.Player;
import java.math.BigDecimal;

/**
 * 球员服务接口
 *
 * @author Gemini
 */
public interface PlayerService extends IService<Player> {

    /**
     * 根据关联用户 ID 获取球员档案
     *
     * @param userId 用户 ID
     * @return 球员档案，不存在返回 null
     */
    Player getByUserId(Long userId);

    /**
     * 管理员手动修正球员评分
     * @param playerId 球员ID
     * @param newRating 新评分
     * @param reason 修正原因（用于审计）
     */
    void updateRatingManually(Long playerId, BigDecimal newRating, String reason);
}
