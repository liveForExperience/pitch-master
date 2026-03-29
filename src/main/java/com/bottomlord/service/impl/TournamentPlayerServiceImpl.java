package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerRatingHistory;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.entity.PlayerStat;
import com.bottomlord.entity.Tournament;
import com.bottomlord.entity.TournamentPlayer;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.mapper.PlayerRatingHistoryMapper;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.mapper.PlayerStatMapper;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.mapper.TournamentPlayerMapper;
import com.bottomlord.service.TournamentPlayerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TournamentPlayerServiceImpl extends ServiceImpl<TournamentPlayerMapper, TournamentPlayer>
        implements TournamentPlayerService {

    @Autowired
    private TournamentMapper tournamentMapper;

    @Autowired
    private PlayerMapper playerMapper;

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @Autowired
    private PlayerStatMapper playerStatMapper;

    @Autowired
    private PlayerRatingHistoryMapper playerRatingHistoryMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TournamentPlayer join(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null) {
            throw new IllegalArgumentException("Tournament 不存在");
        }
        Player player = playerMapper.selectById(playerId);
        if (player == null) {
            throw new IllegalArgumentException("球员不存在");
        }

        TournamentPlayer existing = getByTournamentAndPlayer(tournamentId, playerId);
        if (existing != null) {
            if ("ACTIVE".equals(existing.getJoinStatus())) {
                throw new IllegalArgumentException("已加入该 Tournament");
            }
            if ("PENDING".equals(existing.getJoinStatus())) {
                throw new IllegalArgumentException("已提交加入申请，请等待审批");
            }
            // LEFT 状态可重新加入
            String joinStatus = "APPROVAL".equals(tournament.getJoinMode()) ? "PENDING" : "ACTIVE";
            existing.setJoinStatus(joinStatus);
            existing.setStatus(1);
            this.updateById(existing);
            return existing;
        }

        TournamentPlayer tp = new TournamentPlayer();
        tp.setTournamentId(tournamentId);
        tp.setPlayerId(playerId);
        tp.setRating(new BigDecimal("5.00"));
        tp.setRatingVersion(2);
        tp.setStatus(1);
        tp.setJoinStatus("APPROVAL".equals(tournament.getJoinMode()) ? "PENDING" : "ACTIVE");
        this.save(tp);

        // 初始化该 Tournament 下的评分档案和统计
        if ("ACTIVE".equals(tp.getJoinStatus())) {
            initTournamentData(tournamentId, playerId);
        }

        log.info("球员加入 Tournament: playerId={}, tournamentId={}, joinStatus={}", playerId, tournamentId, tp.getJoinStatus());
        return tp;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void leave(Long tournamentId, Long playerId) {
        TournamentPlayer tp = getByTournamentAndPlayer(tournamentId, playerId);
        if (tp == null || "LEFT".equals(tp.getJoinStatus())) {
            throw new IllegalArgumentException("未加入该 Tournament");
        }
        tp.setJoinStatus("LEFT");
        this.updateById(tp);
        log.info("球员退出 Tournament: playerId={}, tournamentId={}", playerId, tournamentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approve(Long tournamentId, Long playerId) {
        TournamentPlayer tp = getByTournamentAndPlayer(tournamentId, playerId);
        if (tp == null || !"PENDING".equals(tp.getJoinStatus())) {
            throw new IllegalArgumentException("未找到待审批的加入申请");
        }
        tp.setJoinStatus("ACTIVE");
        this.updateById(tp);

        initTournamentData(tournamentId, playerId);
        log.info("审批通过: playerId={}, tournamentId={}", playerId, tournamentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reject(Long tournamentId, Long playerId) {
        TournamentPlayer tp = getByTournamentAndPlayer(tournamentId, playerId);
        if (tp == null || !"PENDING".equals(tp.getJoinStatus())) {
            throw new IllegalArgumentException("未找到待审批的加入申请");
        }
        tp.setJoinStatus("LEFT");
        this.updateById(tp);
        log.info("审批拒绝: playerId={}, tournamentId={}", playerId, tournamentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TournamentPlayer adminAddPlayer(Long tournamentId, Long playerId) {
        TournamentPlayer existing = getByTournamentAndPlayer(tournamentId, playerId);
        if (existing != null && "ACTIVE".equals(existing.getJoinStatus())) {
            throw new IllegalArgumentException("球员已在该 Tournament 中");
        }

        if (existing != null) {
            existing.setJoinStatus("ACTIVE");
            existing.setStatus(1);
            this.updateById(existing);
            initTournamentData(tournamentId, playerId);
            return existing;
        }

        TournamentPlayer tp = new TournamentPlayer();
        tp.setTournamentId(tournamentId);
        tp.setPlayerId(playerId);
        tp.setRating(new BigDecimal("5.00"));
        tp.setRatingVersion(2);
        tp.setStatus(1);
        tp.setJoinStatus("ACTIVE");
        this.save(tp);

        initTournamentData(tournamentId, playerId);
        log.info("管理员添加球员到 Tournament: playerId={}, tournamentId={}", playerId, tournamentId);
        return tp;
    }

    @Override
    public List<TournamentPlayer> listActiveByTournament(Long tournamentId) {
        return baseMapper.selectActiveByTournament(tournamentId);
    }

    @Override
    public TournamentPlayer getByTournamentAndPlayer(Long tournamentId, Long playerId) {
        return this.getOne(new LambdaQueryWrapper<TournamentPlayer>()
                .eq(TournamentPlayer::getTournamentId, tournamentId)
                .eq(TournamentPlayer::getPlayerId, playerId));
    }

    @Override
    public List<Long> getJoinedTournamentIds(Long playerId) {
        List<TournamentPlayer> list = this.list(new LambdaQueryWrapper<TournamentPlayer>()
                .eq(TournamentPlayer::getPlayerId, playerId)
                .eq(TournamentPlayer::getJoinStatus, "ACTIVE")
                .select(TournamentPlayer::getTournamentId));
        return list.stream().map(TournamentPlayer::getTournamentId).collect(Collectors.toList());
    }

    /**
     * 初始化球员在该 Tournament 下的评分档案和统计（如果不存在）
     */
    private void initTournamentData(Long tournamentId, Long playerId) {
        // player_rating_profile
        Long profileCount = playerRatingProfileMapper.selectCount(new LambdaQueryWrapper<PlayerRatingProfile>()
                .eq(PlayerRatingProfile::getPlayerId, playerId)
                .eq(PlayerRatingProfile::getTournamentId, tournamentId));
        if (profileCount == null || profileCount == 0) {
            PlayerRatingProfile profile = new PlayerRatingProfile();
            profile.setPlayerId(playerId);
            profile.setTournamentId(tournamentId);
            profile.setSkillRating(new BigDecimal("5.00"));
            profile.setPerformanceRating(new BigDecimal("5.00"));
            profile.setEngagementRating(new BigDecimal("5.00"));
            profile.setProvisionalMatches(0);
            profile.setAppearanceCount(0);
            profile.setActiveStreakWeeks(0);
            profile.setRatingVersion(2);
            playerRatingProfileMapper.insert(profile);
        }

        // player_stat
        Long statCount = playerStatMapper.selectCount(new LambdaQueryWrapper<PlayerStat>()
                .eq(PlayerStat::getPlayerId, playerId)
                .eq(PlayerStat::getTournamentId, tournamentId));
        if (statCount == null || statCount == 0) {
            PlayerStat stat = new PlayerStat();
            stat.setPlayerId(playerId);
            stat.setTournamentId(tournamentId);
            stat.setTotalMatches(0);
            stat.setWins(0);
            stat.setDraws(0);
            stat.setLosses(0);
            stat.setTotalGoals(0);
            stat.setTotalAssists(0);
            stat.setTotalMvps(0);
            stat.setCleanSheets(0);
            stat.setRecentForm("");
            playerStatMapper.insert(stat);
        }

        // player_rating_history - INITIALIZATION record
        PlayerRatingHistory history = new PlayerRatingHistory();
        history.setPlayerId(playerId);
        history.setTournamentId(tournamentId);
        history.setDimension("TOTAL");
        history.setSourceType("INITIALIZATION");
        history.setOldRating(new BigDecimal("5.00"));
        history.setNewRating(new BigDecimal("5.00"));
        history.setOldValue(new BigDecimal("5.00"));
        history.setNewValue(new BigDecimal("5.00"));
        history.setDelta(BigDecimal.ZERO);
        history.setChangeReason("INITIALIZATION");
        history.setReasonCode("INITIALIZATION");
        history.setReasonDetail("tournament-join-bootstrap");
        history.setCreateTime(LocalDateTime.now());
        playerRatingHistoryMapper.insert(history);
    }
}
