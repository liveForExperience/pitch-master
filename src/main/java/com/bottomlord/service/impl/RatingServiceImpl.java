package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bottomlord.entity.*;
import com.bottomlord.mapper.*;
import com.bottomlord.service.RatingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 核心评分计算服务实现类 (CPI Pipeline)
 */
@Service
@Slf4j
public class RatingServiceImpl implements RatingService {

    private static final BigDecimal DEFAULT_RATING = new BigDecimal("5.00");
    private static final BigDecimal MIN_RATING = new BigDecimal("1.00");
    private static final BigDecimal MAX_RATING = new BigDecimal("20.00");
    private static final BigDecimal SKILL_WEIGHT = new BigDecimal("0.40");
    private static final BigDecimal PERFORMANCE_WEIGHT = new BigDecimal("0.40");
    private static final BigDecimal ENGAGEMENT_WEIGHT = new BigDecimal("0.20");
    private static final BigDecimal PROTECTION_FACTOR = new BigDecimal("0.60");
    private static final BigDecimal SKILL_SMOOTHING = new BigDecimal("0.15");
    private static final BigDecimal PERFORMANCE_WIN_DELTA = new BigDecimal("0.25");
    private static final BigDecimal PERFORMANCE_DRAW_DELTA = new BigDecimal("0.05");
    private static final BigDecimal PERFORMANCE_LOSS_DELTA = new BigDecimal("-0.15");
    private static final BigDecimal PERFORMANCE_GOAL_DELTA = new BigDecimal("0.06");
    private static final BigDecimal PERFORMANCE_ASSIST_DELTA = new BigDecimal("0.05");
    private static final BigDecimal PERFORMANCE_MVP_DELTA = new BigDecimal("0.10");
    private static final BigDecimal PERFORMANCE_MATCH_RATING_DELTA = new BigDecimal("0.04");
    private static final BigDecimal PERFORMANCE_MAX_DELTA = new BigDecimal("0.60");
    private static final BigDecimal PERFORMANCE_MIN_DELTA = new BigDecimal("-0.40");
    private static final BigDecimal ENGAGEMENT_APPEARANCE_DELTA = new BigDecimal("0.03");
    private static final BigDecimal ENGAGEMENT_MUTUAL_DELTA = new BigDecimal("0.02");
    private static final BigDecimal ENGAGEMENT_RETURN_BONUS = new BigDecimal("0.05");
    private static final BigDecimal ENGAGEMENT_DECAY_STEP = new BigDecimal("0.10");
    private static final int INACTIVE_THRESHOLD_DAYS = 30;

    @Autowired
    private PlayerMapper playerMapper;

    @Autowired
    private PlayerAttributeMapper attributeMapper;

    @Autowired
    private PlayerStatMapper statMapper;

    @Autowired
    private PlayerRatingHistoryMapper historyMapper;

    @Autowired
    private PlayerRatingProfileMapper profileMapper;

    @Autowired
    private MatchMapper matchMapper;

    @Autowired
    private MatchGameMapper gameMapper;

    @Autowired
    private GameParticipantMapper participantMapper;

    @Autowired
    private MatchRegistrationMapper registrationMapper;

    @Autowired
    private PlayerMutualRatingMapper mutualRatingMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void settleGameRating(Long gameId) {
        MatchGame game = gameMapper.selectById(gameId);
        if (game == null) return;

        Match match = matchMapper.selectById(game.getMatchId());
        if (match == null) {
            log.error("结算评分失败：未找到关联赛事. matchId={}", game.getMatchId());
            return;
        }

        List<GameParticipant> participants = participantMapper.selectList(
                new LambdaQueryWrapper<GameParticipant>().eq(GameParticipant::getGameId, gameId));

        log.info("开始结算 Game 评分流水线: gameId={}, matchId={}, tournamentId={}, 参与人数={}", 
                gameId, game.getMatchId(), match.getTournamentId(), participants.size());

        LocalDateTime settledAt = LocalDateTime.now();
        Long matchId = game.getMatchId();
        Long tournamentId = match.getTournamentId();
        
        for (GameParticipant p : participants) {
            try {
                Long playerId = p.getPlayerId();
                Player player = playerMapper.selectById(playerId);
                if (player == null) continue;

                // 1. 获取阵营与胜负状态
                MatchRegistration reg = registrationMapper.selectOne(new LambdaQueryWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId));
                
                if (reg == null || reg.getGroupIndex() == null) {
                    log.warn("球员未在报名表中找到分组信息: playerId={}, matchId={}", playerId, matchId);
                    continue;
                }

                boolean isTeamA = reg.getGroupIndex().equals(game.getTeamAIndex());
                double actualScore = 0.5; // 默认平局
                if (game.getScoreA() > game.getScoreB()) {
                    actualScore = isTeamA ? 1.0 : 0.0;
                } else if (game.getScoreA() < game.getScoreB()) {
                    actualScore = isTeamA ? 0.0 : 1.0;
                }

                PlayerRatingProfile profile = ensureProfile(playerId, tournamentId);
                BigDecimal oldSkill = defaultIfNull(profile.getSkillRating(), DEFAULT_RATING);
                BigDecimal oldPerformance = defaultIfNull(profile.getPerformanceRating(), DEFAULT_RATING);
                BigDecimal oldEngagement = defaultIfNull(profile.getEngagementRating(), DEFAULT_RATING);
                
                // 全局 Rating 仍然保留在 Player 表，但结算时优先参考 Profile
                BigDecimal oldTotal = defaultIfNull(player.getRating(), calculateTotalRating(oldSkill, oldPerformance, oldEngagement));
                LocalDateTime previousAttendanceTime = profile.getLastAttendanceTime() != null ? profile.getLastAttendanceTime() : player.getLastAttendanceTime();

                int playedMatchesBefore = defaultIfNull(profile.getProvisionalMatches(), 0);
                BigDecimal factor = playedMatchesBefore < 3 ? PROTECTION_FACTOR : BigDecimal.ONE;

                BigDecimal newSkill = calculateSkillRating(oldSkill, p, factor);
                BigDecimal newPerformance = calculatePerformanceRating(oldPerformance, p, actualScore, factor);

                int newActiveStreakWeeks = calculateActiveStreakWeeks(profile.getLastAttendanceTime(), defaultIfNull(profile.getActiveStreakWeeks(), 0), settledAt);
                BigDecimal settlementEngagement = calculateEngagementRating(oldEngagement, playerId, matchId, newActiveStreakWeeks);
                BigDecimal settlementTotal = calculateTotalRating(newSkill, newPerformance, settlementEngagement);
                boolean returningAfterInactivity = isReturningAfterInactivity(previousAttendanceTime, settledAt);
                BigDecimal newEngagement = settlementEngagement;
                BigDecimal newTotal = settlementTotal;
                if (returningAfterInactivity) {
                    newEngagement = clamp(settlementEngagement.add(ENGAGEMENT_RETURN_BONUS));
                    newTotal = calculateTotalRating(newSkill, newPerformance, newEngagement);
                }

                profile.setSkillRating(newSkill);
                profile.setPerformanceRating(newPerformance);
                profile.setEngagementRating(newEngagement);
                profile.setProvisionalMatches(Math.min(playedMatchesBefore + 1, 3));
                profile.setAppearanceCount(defaultIfNull(profile.getAppearanceCount(), 0) + 1);
                profile.setActiveStreakWeeks(newActiveStreakWeeks);
                profile.setLastAttendanceTime(settledAt);
                profile.setLastDecayTime(null);
                profile.setRatingVersion(2);
                profileMapper.updateById(profile);

                insertHistory(playerId, matchId, tournamentId, "SKILL", "MATCH_SETTLEMENT", oldSkill, newSkill, "MATCH_SKILL", "game:" + gameId);
                insertHistory(playerId, matchId, tournamentId, "PERFORMANCE", "MATCH_SETTLEMENT", oldPerformance, newPerformance, "MATCH_PERFORMANCE", "game:" + gameId);
                insertHistory(playerId, matchId, tournamentId, "ENGAGEMENT", "MATCH_SETTLEMENT", oldEngagement, settlementEngagement, "MATCH_ENGAGEMENT", "game:" + gameId);
                insertHistory(playerId, matchId, tournamentId, "TOTAL", "MATCH_SETTLEMENT", oldTotal, settlementTotal, "MATCH_TOTAL", "game:" + gameId);
                if (returningAfterInactivity) {
                    insertHistory(playerId, matchId, tournamentId, "ENGAGEMENT", "RETURN_BONUS", settlementEngagement, newEngagement, "RETURN_BONUS", "game:" + gameId);
                    insertHistory(playerId, matchId, tournamentId, "TOTAL", "RETURN_BONUS", settlementTotal, newTotal, "RETURN_BONUS", "game:" + gameId);
                }

                // 更新 Player 表中的全局 Rating (作为该球员在最近一个 Tournament 的表现映射)
                player.setRating(newTotal);
                player.setRatingVersion(2);
                player.setLastMatchTime(settledAt);
                player.setLastAttendanceTime(settledAt);
                playerMapper.updateById(player);

                // 3. FM 属性微调 (1-20 区间)
                updatePlayerAttributes(playerId, p, actualScore);

                // 4. 战绩统计更新
                updatePlayerStats(playerId, p, actualScore);
            } catch (Exception e) {
                log.error("结算球员评分失败: playerId={}, gameId={}, error={}", p.getPlayerId(), gameId, e.getMessage(), e);
                throw new RuntimeException("结算球员评分失败: " + p.getPlayerId(), e);
            }
        }
    }

    private void updatePlayerAttributes(Long playerId, GameParticipant p, double actualScore) {
        PlayerAttribute attr = attributeMapper.selectOne(new LambdaQueryWrapper<PlayerAttribute>()
                .eq(PlayerAttribute::getPlayerId, playerId));
        if (attr == null) return;

        // FM 风格微调逻辑 (1-20)
        // 进球 -> 提升射门
        if (p.getGoals() != null && p.getGoals() > 0) {
            attr.setShooting(Math.min(20, attr.getShooting() + 1));
        }
        // 助攻 -> 提升传球
        if (p.getAssists() != null && p.getAssists() > 0) {
            attr.setPassing(Math.min(20, attr.getPassing() + 1));
        }
        // 胜利 -> 微调体能与速度
        if (actualScore == 1.0) {
            attr.setPace(Math.min(20, attr.getPace() + 1));
            attr.setPhysical(Math.min(20, attr.getPhysical() + 1));
        }

        // 重新计算身价 (CPI * 1000 + 属性加权)
        BigDecimal currentRating = playerMapper.selectById(playerId).getRating();
        BigDecimal attrBonus = new BigDecimal((attr.getPace() + attr.getShooting() + attr.getPassing() + 
                                               attr.getDribbling() + attr.getDefending() + attr.getPhysical()) * 50);
        attr.setMarketValue(currentRating.multiply(new BigDecimal("1000")).add(attrBonus));

        attributeMapper.updateById(attr);
    }

    private void updatePlayerStats(Long playerId, GameParticipant p, double actualScore) {
        PlayerStat stat = statMapper.selectOne(new LambdaQueryWrapper<PlayerStat>()
                .eq(PlayerStat::getPlayerId, playerId));
        if (stat == null) return;

        stat.setTotalMatches(defaultIfNull(stat.getTotalMatches(), 0) + 1);
        if (actualScore == 1.0) stat.setWins(defaultIfNull(stat.getWins(), 0) + 1);
        else if (actualScore == 0.0) stat.setLosses(defaultIfNull(stat.getLosses(), 0) + 1);
        else stat.setDraws(defaultIfNull(stat.getDraws(), 0) + 1);

        stat.setTotalGoals(defaultIfNull(stat.getTotalGoals(), 0) + defaultIfNull(p.getGoals(), 0));
        stat.setTotalAssists(defaultIfNull(stat.getTotalAssists(), 0) + defaultIfNull(p.getAssists(), 0));
        if (Boolean.TRUE.equals(p.getIsMvp())) {
            stat.setTotalMvps(defaultIfNull(stat.getTotalMvps(), 0) + 1);
        }

        statMapper.updateById(stat);
    }

    @Override
    public void processRatingDecay() {
        processRatingDecay(LocalDateTime.now());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processRatingDecay(LocalDateTime atTime) {
        LocalDateTime threshold = atTime.minusDays(INACTIVE_THRESHOLD_DAYS);
        List<PlayerRatingProfile> profiles = profileMapper.selectList(new LambdaQueryWrapper<PlayerRatingProfile>()
                .isNotNull(PlayerRatingProfile::getLastAttendanceTime)
                .le(PlayerRatingProfile::getLastAttendanceTime, threshold));

        int processedCount = 0;
        for (PlayerRatingProfile profile : profiles) {
            Player player = playerMapper.selectById(profile.getPlayerId());
            if (player == null || player.getStatus() == null || !player.getStatus().equals(1)) {
                continue;
            }
            if (!shouldApplyDecay(profile, atTime)) {
                continue;
            }

            BigDecimal oldEngagement = defaultIfNull(profile.getEngagementRating(), DEFAULT_RATING);
            BigDecimal oldTotal = defaultIfNull(player.getRating(),
                    calculateTotalRating(defaultIfNull(profile.getSkillRating(), DEFAULT_RATING),
                            defaultIfNull(profile.getPerformanceRating(), DEFAULT_RATING),
                            oldEngagement));
            BigDecimal newEngagement = clamp(oldEngagement.subtract(ENGAGEMENT_DECAY_STEP));
            profile.setLastDecayTime(atTime);

            if (newEngagement.compareTo(oldEngagement) == 0) {
                profileMapper.updateById(profile);
                continue;
            }

            BigDecimal newTotal = calculateTotalRating(
                    defaultIfNull(profile.getSkillRating(), DEFAULT_RATING),
                    defaultIfNull(profile.getPerformanceRating(), DEFAULT_RATING),
                    newEngagement);

            profile.setEngagementRating(newEngagement);
            profileMapper.updateById(profile);

            player.setRating(newTotal);
            player.setRatingVersion(2);
            playerMapper.updateById(player);

            insertHistory(player.getId(), null, profile.getTournamentId(), "DECAY", "INACTIVITY_DECAY", oldEngagement, newEngagement,
                    "INACTIVITY_DECAY", "at:" + atTime);
            insertHistory(player.getId(), null, profile.getTournamentId(), "TOTAL", "INACTIVITY_DECAY", oldTotal, newTotal,
                    "INACTIVITY_DECAY", "at:" + atTime);
            processedCount++;
        }
        log.info("[逻辑时间: {}] 完成不活跃衰减，处理 {} 名球员。", atTime, processedCount);
    }

    private PlayerRatingProfile ensureProfile(Long playerId, Long tournamentId) {
        PlayerRatingProfile profile = profileMapper.selectOne(new LambdaQueryWrapper<PlayerRatingProfile>()
                .eq(PlayerRatingProfile::getPlayerId, playerId)
                .eq(PlayerRatingProfile::getTournamentId, tournamentId));
        if (profile != null) {
            return profile;
        }

        PlayerRatingProfile newProfile = new PlayerRatingProfile();
        newProfile.setPlayerId(playerId);
        newProfile.setTournamentId(tournamentId);
        newProfile.setSkillRating(DEFAULT_RATING);
        newProfile.setPerformanceRating(DEFAULT_RATING);
        newProfile.setEngagementRating(DEFAULT_RATING);
        newProfile.setProvisionalMatches(0);
        newProfile.setAppearanceCount(0);
        newProfile.setActiveStreakWeeks(0);
        newProfile.setRatingVersion(2);
        profileMapper.insert(newProfile);
        return newProfile;
    }

    private BigDecimal calculateSkillRating(BigDecimal currentSkill, GameParticipant participant, BigDecimal factor) {
        BigDecimal matchSkillTarget = mapParticipantRatingToTwentyScale(participant.getRating())
                .add(BigDecimal.valueOf(Math.min(defaultIfNull(participant.getGoals(), 0), 3)).multiply(new BigDecimal("0.40")))
                .add(BigDecimal.valueOf(Math.min(defaultIfNull(participant.getAssists(), 0), 3)).multiply(new BigDecimal("0.30")));
        if (Boolean.TRUE.equals(participant.getIsMvp())) {
            matchSkillTarget = matchSkillTarget.add(new BigDecimal("0.50"));
        }
        matchSkillTarget = clamp(matchSkillTarget);
        BigDecimal delta = matchSkillTarget.subtract(currentSkill)
                .multiply(SKILL_SMOOTHING)
                .multiply(factor);
        return clamp(currentSkill.add(delta));
    }

    private BigDecimal calculatePerformanceRating(BigDecimal currentPerformance, GameParticipant participant, double actualScore, BigDecimal factor) {
        BigDecimal delta;
        if (actualScore == 1.0) {
            delta = PERFORMANCE_WIN_DELTA;
        } else if (actualScore == 0.5) {
            delta = PERFORMANCE_DRAW_DELTA;
        } else {
            delta = PERFORMANCE_LOSS_DELTA;
        }

        delta = delta
                .add(BigDecimal.valueOf(Math.min(defaultIfNull(participant.getGoals(), 0), 3)).multiply(PERFORMANCE_GOAL_DELTA))
                .add(BigDecimal.valueOf(Math.min(defaultIfNull(participant.getAssists(), 0), 3)).multiply(PERFORMANCE_ASSIST_DELTA))
                .add(calculateParticipantRatingAdjustment(participant.getRating()));
        if (Boolean.TRUE.equals(participant.getIsMvp())) {
            delta = delta.add(PERFORMANCE_MVP_DELTA);
        }

        delta = clampDelta(delta.multiply(factor), PERFORMANCE_MIN_DELTA, PERFORMANCE_MAX_DELTA);
        return clamp(currentPerformance.add(delta));
    }

    private BigDecimal calculateEngagementRating(BigDecimal currentEngagement, Long playerId, Long matchId, int activeStreakWeeks) {
        BigDecimal delta = ENGAGEMENT_APPEARANCE_DELTA;
        if (hasSubmittedMutualRating(playerId, matchId)) {
            delta = delta.add(ENGAGEMENT_MUTUAL_DELTA);
        }
        BigDecimal streakBonus = new BigDecimal(Math.min(activeStreakWeeks, 5)).multiply(new BigDecimal("0.01"));
        return clamp(currentEngagement.add(delta.add(streakBonus)));
    }

    private BigDecimal calculateTotalRating(BigDecimal skillRating, BigDecimal performanceRating, BigDecimal engagementRating) {
        return clamp(skillRating.multiply(SKILL_WEIGHT)
                .add(performanceRating.multiply(PERFORMANCE_WEIGHT))
                .add(engagementRating.multiply(ENGAGEMENT_WEIGHT)));
    }

    private BigDecimal calculateParticipantRatingAdjustment(BigDecimal participantRating) {
        if (participantRating == null) {
            return BigDecimal.ZERO;
        }
        return participantRating.subtract(new BigDecimal("6.0")).multiply(PERFORMANCE_MATCH_RATING_DELTA);
    }

    private BigDecimal mapParticipantRatingToTwentyScale(BigDecimal participantRating) {
        BigDecimal safeRating = participantRating == null ? new BigDecimal("6.0") : participantRating;
        return clamp(safeRating.multiply(new BigDecimal("2")));
    }

    private int calculateActiveStreakWeeks(LocalDateTime lastAttendanceTime, int currentStreakWeeks, LocalDateTime now) {
        if (lastAttendanceTime == null) {
            return 1;
        }
        long days = Math.abs(Duration.between(lastAttendanceTime, now).toDays());
        if (days <= 6) {
            return Math.max(currentStreakWeeks, 1);
        }
        if (days <= 14) {
            return currentStreakWeeks + 1;
        }
        return 1;
    }

    private boolean hasSubmittedMutualRating(Long playerId, Long matchId) {
        Long count = mutualRatingMapper.selectCount(new LambdaQueryWrapper<PlayerMutualRating>()
                .eq(PlayerMutualRating::getMatchId, matchId)
                .eq(PlayerMutualRating::getFromPlayerId, playerId));
        return count != null && count > 0;
    }

    private boolean isReturningAfterInactivity(LocalDateTime previousAttendanceTime, LocalDateTime settledAt) {
        if (previousAttendanceTime == null) {
            return false;
        }
        return Duration.between(previousAttendanceTime, settledAt).toDays() > INACTIVE_THRESHOLD_DAYS;
    }

    private boolean shouldApplyDecay(PlayerRatingProfile profile, LocalDateTime atTime) {
        if (profile.getLastAttendanceTime() == null) {
            return false;
        }
        if (profile.getLastAttendanceTime().isAfter(atTime.minusDays(INACTIVE_THRESHOLD_DAYS))) {
            return false;
        }
        if (profile.getLastDecayTime() == null) {
            return true;
        }
        return Duration.between(profile.getLastDecayTime(), atTime).toDays() >= 7;
    }

    private void insertHistory(Long playerId, Long matchId, Long tournamentId, String dimension, String sourceType,
                               BigDecimal oldValue, BigDecimal newValue, String reasonCode, String reasonDetail) {
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(playerId);
        history.setMatchId(matchId);
        history.setTournamentId(tournamentId);
        history.setDimension(dimension);
        history.setSourceType(sourceType);
        history.setOldRating(oldValue);
        history.setNewRating(newValue);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setDelta(newValue.subtract(oldValue).setScale(2, RoundingMode.HALF_UP));
        history.setChangeReason(reasonCode);
        history.setReasonCode(reasonCode);
        history.setReasonDetail(reasonDetail);
        history.setCreateTime(LocalDateTime.now());
        historyMapper.insert(history);
    }

    private BigDecimal clamp(BigDecimal value) {
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        if (scaled.compareTo(MIN_RATING) < 0) {
            return MIN_RATING;
        }
        if (scaled.compareTo(MAX_RATING) > 0) {
            return MAX_RATING;
        }
        return scaled;
    }

    private BigDecimal clampDelta(BigDecimal value, BigDecimal min, BigDecimal max) {
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        if (scaled.compareTo(min) < 0) {
            return min;
        }
        if (scaled.compareTo(max) > 0) {
            return max;
        }
        return scaled;
    }

    private BigDecimal defaultIfNull(BigDecimal value, BigDecimal fallback) {
        return value == null ? fallback : value;
    }

    private Integer defaultIfNull(Integer value, Integer fallback) {
        return value == null ? fallback : value;
    }
}