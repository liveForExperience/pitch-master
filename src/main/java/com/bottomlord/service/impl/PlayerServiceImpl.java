package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingHistory;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.mapper.PlayerRatingHistoryMapper;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.mapper.UserMapper;
import com.bottomlord.service.PlayerService;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@Slf4j
public class PlayerServiceImpl extends ServiceImpl<PlayerMapper, Player> implements PlayerService {

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @Autowired
    private PlayerRatingHistoryMapper playerRatingHistoryMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean save(Player player) {
        boolean success = super.save(player);
        if (success) {
            log.info("新球员入驻: id={}, nickname={}", player.getId(), player.getNickname());
        }
        return success;
    }

    @Override
    public Player getByUserId(Long userId) {
        return baseMapper.selectOne(new LambdaQueryWrapper<Player>()
                .eq(Player::getUserId, userId));
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateRatingDimensionManually(Long playerId, Long tournamentId, String dimension, BigDecimal newValue, String reason) {
        Player player = this.getById(playerId);
        if (player == null) throw new IllegalArgumentException("球员不存在");

        PlayerRatingProfile profile = playerRatingProfileMapper.selectOne(
                new LambdaQueryWrapper<PlayerRatingProfile>()
                        .eq(PlayerRatingProfile::getPlayerId, playerId)
                        .eq(PlayerRatingProfile::getTournamentId, tournamentId));
        if (profile == null) throw new IllegalArgumentException("球员在该赛事的评分档案不存在");

        BigDecimal oldValue;
        switch (dimension.toUpperCase()) {
            case "SKILL":
                oldValue = profile.getSkillRating();
                profile.setSkillRating(newValue);
                break;
            case "PERFORMANCE":
                oldValue = profile.getPerformanceRating();
                profile.setPerformanceRating(newValue);
                break;
            case "ENGAGEMENT":
                oldValue = profile.getEngagementRating();
                profile.setEngagementRating(newValue);
                break;
            default:
                throw new IllegalArgumentException("无效的评分维度: " + dimension);
        }

        BigDecimal skill = profile.getSkillRating() != null ? profile.getSkillRating() : new BigDecimal("5.00");
        BigDecimal performance = profile.getPerformanceRating() != null ? profile.getPerformanceRating() : new BigDecimal("5.00");
        BigDecimal engagement = profile.getEngagementRating() != null ? profile.getEngagementRating() : new BigDecimal("5.00");
        BigDecimal oldTotal = skill.multiply(new BigDecimal("0.40"))
                .add(performance.multiply(new BigDecimal("0.40")))
                .add(engagement.multiply(new BigDecimal("0.20")))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal newTotal = skill.multiply(new BigDecimal("0.40"))
                .add(performance.multiply(new BigDecimal("0.40")))
                .add(engagement.multiply(new BigDecimal("0.20")))
                .setScale(2, RoundingMode.HALF_UP);

        profile.setRatingVersion(2);
        playerRatingProfileMapper.updateById(profile);

        Long operatorUserId = getCurrentUserId();
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(playerId);
        history.setTournamentId(tournamentId);
        history.setDimension(dimension.toUpperCase());
        history.setSourceType("ADMIN_CORRECTION");
        history.setOldRating(oldTotal);
        history.setNewRating(newTotal);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setDelta(newValue.subtract(oldValue == null ? BigDecimal.ZERO : oldValue));
        history.setChangeReason("ADMIN_CORRECTION");
        history.setReasonCode("ADMIN_CORRECTION");
        history.setReasonDetail(reason);
        history.setOperatorUserId(operatorUserId);
        history.setCreateTime(LocalDateTime.now());
        playerRatingHistoryMapper.insert(history);
    }

    private Long getCurrentUserId() {
        Object principal = org.apache.shiro.SecurityUtils.getSubject().getPrincipal();
        if (principal instanceof com.bottomlord.entity.User) {
            return ((com.bottomlord.entity.User) principal).getId();
        }
        return null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateProfile(Long playerId, com.bottomlord.dto.ProfileUpdateRequest request) {
        Player player = this.getById(playerId);
        if (player == null) {
            throw new IllegalArgumentException("球员不存在");
        }

        player.setNickname(request.getNickname());
        player.setPreferredFoot(request.getPreferredFoot());
        player.setPosition(request.getPosition());
        player.setAge(request.getAge());
        player.setHeight(request.getHeight());
        this.updateById(player);

        if (player.getUserId() != null && request.getRealName() != null) {
            com.bottomlord.entity.User user = userMapper.selectById(player.getUserId());
            if (user != null) {
                user.setRealName(request.getRealName());
                userMapper.updateById(user);
            }
        }
    }
}