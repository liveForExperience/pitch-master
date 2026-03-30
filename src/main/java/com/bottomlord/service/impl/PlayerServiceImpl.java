package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerAttribute;
import com.bottomlord.entity.PlayerRatingHistory;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.mapper.ClubMapper;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.mapper.PlayerAttributeMapper;
import com.bottomlord.mapper.PlayerRatingHistoryMapper;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.mapper.UserMapper;
import com.bottomlord.entity.Club;
import com.bottomlord.entity.Tournament;
import com.bottomlord.service.PlayerService;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Slf4j
public class PlayerServiceImpl extends ServiceImpl<PlayerMapper, Player> implements PlayerService {

    @Autowired
    private ClubMapper clubMapper;

    @Autowired
    private TournamentMapper tournamentMapper;

    @Autowired
    private PlayerAttributeMapper playerAttributeMapper;

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @Autowired
    private PlayerRatingHistoryMapper playerRatingHistoryMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean save(Player player) {
        if (player.getRating() == null) {
            player.setRating(new BigDecimal("5.00"));
        }
        if (player.getRatingVersion() == null) {
            player.setRatingVersion(2);
        }
        boolean success = super.save(player);
        if (success) {
            // 创建全局 FM 属性（player_attribute 表是全局的，不分 tournament）
            PlayerAttribute attr = new PlayerAttribute();
            attr.setPlayerId(player.getId());
            attr.setPace(10);
            attr.setShooting(10);
            attr.setPassing(10);
            attr.setDribbling(10);
            attr.setDefending(10);
            attr.setPhysical(10);
            attr.setMarketValue(BigDecimal.ZERO);
            playerAttributeMapper.insert(attr);

            // 注意：PlayerStat、PlayerRatingProfile、PlayerRatingHistory 均为 tournament 维度数据
            // 这些数据会在 TournamentPlayerService.initTournamentData() 中创建
            // 当球员加入具体 tournament 时才初始化
            log.info("新球员入驻，已初始化全局属性: id={}, nickname={}", player.getId(), player.getNickname());
        }
        return success;
    }

    @Override
    public Player getByUserId(Long userId) {
        Player player = baseMapper.selectOne(new LambdaQueryWrapper<Player>()
                .eq(Player::getUserId, userId));
        return populateNames(player);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateRatingManually(Long playerId, BigDecimal newRating, String reason) {
        Player player = this.getById(playerId);
        if (player == null) throw new IllegalArgumentException("球员不存在");
        BigDecimal oldRating = player.getRating();
        player.setRating(newRating);
        player.setRatingVersion(2);
        this.updateById(player);

        Long operatorUserId = getCurrentUserId();
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(playerId);
        history.setDimension("TOTAL");
        history.setSourceType("ADMIN_CORRECTION");
        history.setOldRating(oldRating);
        history.setNewRating(newRating);
        history.setOldValue(oldRating);
        history.setNewValue(newRating);
        history.setDelta(newRating.subtract(oldRating == null ? BigDecimal.ZERO : oldRating));
        history.setChangeReason("ADMIN_CORRECTION");
        history.setReasonCode("ADMIN_CORRECTION");
        history.setReasonDetail(reason);
        history.setOperatorUserId(operatorUserId);
        history.setCreateTime(LocalDateTime.now());
        playerRatingHistoryMapper.insert(history);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateRatingDimensionManually(Long playerId, String dimension, BigDecimal newValue, String reason) {
        Player player = this.getById(playerId);
        if (player == null) throw new IllegalArgumentException("球员不存在");

        PlayerRatingProfile profile = playerRatingProfileMapper.selectOne(
                new LambdaQueryWrapper<PlayerRatingProfile>().eq(PlayerRatingProfile::getPlayerId, playerId));
        if (profile == null) throw new IllegalArgumentException("球员评分档案不存在");

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

        profile.setRatingVersion(2);
        playerRatingProfileMapper.updateById(profile);

        BigDecimal newTotal = profile.getSkillRating().multiply(new BigDecimal("0.40"))
                .add(profile.getPerformanceRating().multiply(new BigDecimal("0.40")))
                .add(profile.getEngagementRating().multiply(new BigDecimal("0.20")));
        newTotal = newTotal.setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal oldTotal = player.getRating();

        player.setRating(newTotal);
        player.setRatingVersion(2);
        this.updateById(player);

        Long operatorUserId = getCurrentUserId();
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(playerId);
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
    public Player getById(Serializable id) {
        return populateNames(super.getById(id));
    }

    private Player populateNames(Player player) {
        if (player == null) return null;
        if (player.getClubId() != null) {
            Club club = clubMapper.selectById(player.getClubId());
            if (club != null) player.setClubName(club.getName());
        }
        if (player.getTournamentId() != null) {
            Tournament tournament = tournamentMapper.selectById(player.getTournamentId());
            if (tournament != null) player.setTournamentName(tournament.getName());
        }
        return player;
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