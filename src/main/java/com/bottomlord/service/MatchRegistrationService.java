package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.MatchRegistration;

import java.util.List;

/**
 * 赛事报名服务接口
 *
 * @author Gemini
 */
public interface MatchRegistrationService extends IService<MatchRegistration> {

    /**
     * 更新支付状态
     *
     * @param matchId 赛事ID
     * @param playerId 球员ID
     * @param paymentStatus 新状态
     */
    void updatePaymentStatus(Long matchId, Long playerId, String paymentStatus);

    /**
     * 获取指定赛事的所有有效报名（未取消）
     *
     * @param matchId 赛事ID
     * @return 报名列表
     */
    List<MatchRegistration> getValidRegistrations(Long matchId);

    /**
     * 获取指定赛事所有需要付费的报名（含后期取消/缺席）
     *
     * @param matchId 赛事ID
     * @return 报名列表
     */
    List<MatchRegistration> getBillableRegistrations(Long matchId);
}
