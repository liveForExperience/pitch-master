package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.mapper.MatchRegistrationMapper;
import com.bottomlord.service.MatchRegistrationService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 赛事报名服务实现类
 *
 * @author Gemini
 */
@Service
public class MatchRegistrationServiceImpl extends ServiceImpl<MatchRegistrationMapper, MatchRegistration> implements MatchRegistrationService {

    @Override
    public void updatePaymentStatus(Long matchId, Long playerId, String paymentStatus) {
        this.update(new LambdaUpdateWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .set(MatchRegistration::getPaymentStatus, paymentStatus));
    }

    @Override
    public List<MatchRegistration> getValidRegistrations(Long matchId) {
        return baseMapper.selectList(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getStatus, "REGISTERED"));
    }

    @Override
    public List<MatchRegistration> getBillableRegistrations(Long matchId) {
        // 需要付费的包含：已报名的，以及被标记为 NO_SHOW（后期取消）的
        return baseMapper.selectList(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .in(MatchRegistration::getStatus, "REGISTERED", "NO_SHOW"));
    }
}
