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
     * 管理员手动修正球员总评分
     * @param playerId 球员ID
     * @param newRating 新评分
     * @param reason 修正原因（用于审计）
     */
    void updateRatingManually(Long playerId, BigDecimal newRating, String reason);

    /**
     * 管理员手动修正球员三维评分
     * @param playerId 球员ID
     * @param dimension 评分维度（SKILL/PERFORMANCE/ENGAGEMENT）
     * @param newValue 新评分值
     * @param reason 修正原因（用于审计）
     */
    void updateRatingDimensionManually(Long playerId, String dimension, BigDecimal newValue, String reason);

    /**
     * 更新球员及其关联用户的基本信息
     *
     * @param playerId 球员ID
     * @param request  请求参数
     */
    void updateProfile(Long playerId, com.bottomlord.dto.ProfileUpdateRequest request);
}
