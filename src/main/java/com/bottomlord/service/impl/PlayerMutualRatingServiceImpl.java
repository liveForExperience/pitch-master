package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerMutualRating;
import com.bottomlord.mapper.PlayerMutualRatingMapper;
import com.bottomlord.service.MatchRegistrationService;
import com.bottomlord.service.PlayerMutualRatingService;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PlayerMutualRatingServiceImpl extends ServiceImpl<PlayerMutualRatingMapper, PlayerMutualRating> implements PlayerMutualRatingService {

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private PlayerService playerService;

    private static final BigDecimal MVP_BONUS = new BigDecimal("0.10");

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitRating(PlayerMutualRating rating, BigDecimal quickTotalScore) {
        // 如果提供了 quickTotalScore (一键评分)，则同步所有维度
        if (quickTotalScore != null) {
            rating.setRatingSkill(quickTotalScore);
            rating.setRatingFitness(quickTotalScore);
            rating.setRatingAttitude(quickTotalScore);
            rating.setRatingVision(quickTotalScore);
        }

        // 基础校验：维度评分不能为空 (至少得有默认值)
        if (rating.getRatingSkill() == null) rating.setRatingSkill(new BigDecimal("5.0"));
        if (rating.getRatingFitness() == null) rating.setRatingFitness(new BigDecimal("5.0"));
        if (rating.getRatingAttitude() == null) rating.setRatingAttitude(new BigDecimal("5.0"));
        if (rating.getRatingVision() == null) rating.setRatingVision(new BigDecimal("5.0"));

        // 手动检查是否存在，以实现 SaveOrUpdate 的业务语义
        PlayerMutualRating existing = this.getOne(new LambdaQueryWrapper<PlayerMutualRating>()
                .eq(PlayerMutualRating::getMatchId, rating.getMatchId())
                .eq(PlayerMutualRating::getFromPlayerId, rating.getFromPlayerId())
                .eq(PlayerMutualRating::getToPlayerId, rating.getToPlayerId()));

        if (existing != null) {
            rating.setId(existing.getId());
            this.updateById(rating);
        } else {
            this.save(rating);
        }
    }

    @Override
    public Map<Long, Integer> countMvpVotes(Long matchId) {
        List<PlayerMutualRating> mvpVotes = this.list(new LambdaQueryWrapper<PlayerMutualRating>()
                .eq(PlayerMutualRating::getMatchId, matchId)
                .eq(PlayerMutualRating::getIsMvpVote, true));

        return mvpVotes.stream()
                .collect(Collectors.groupingBy(
                        PlayerMutualRating::getToPlayerId,
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finalizeMvp(Long matchId, Long manualPlayerId) {
        Long finalMvpId = manualPlayerId;

        // 1. 如果没有手动指定，则自动计算
        if (finalMvpId == null) {
            Map<Long, Integer> votes = countMvpVotes(matchId);
            finalMvpId = votes.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
        }

        if (finalMvpId != null) {
            // 2. 先重置该场比赛的所有 MVP 标记 (防止重复)
            registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                    .eq(MatchRegistration::getMatchId, matchId)
                    .set(MatchRegistration::getIsMvp, false));

            // 3. 设置新的 MVP
            registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                    .eq(MatchRegistration::getMatchId, matchId)
                    .eq(MatchRegistration::getPlayerId, finalMvpId)
                    .set(MatchRegistration::getIsMvp, true));

            // 4. 授予荣誉奖励分 (+0.10)
            Player player = playerService.getById(finalMvpId);
            if (player != null) {
                BigDecimal currentRating = player.getRating() != null ? player.getRating() : new BigDecimal("5.0");
                BigDecimal newRating = currentRating.add(MVP_BONUS).setScale(2, RoundingMode.HALF_UP);
                
                // 限制最高 10.0
                if (newRating.compareTo(new BigDecimal("10.0")) > 0) newRating = new BigDecimal("10.00");
                
                player.setRating(newRating);
                playerService.updateById(player);
            }
        }
    }
}
