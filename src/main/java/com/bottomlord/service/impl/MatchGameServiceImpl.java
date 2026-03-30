package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.common.util.SseManager;
import com.bottomlord.dto.GameDetailVO;
import com.bottomlord.entity.*;
import com.bottomlord.mapper.MatchGameMapper;
import com.bottomlord.mapper.MatchScoreLogMapper;
import com.bottomlord.service.*;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 比赛场次服务实现类
 *
 * @author Gemini
 */
@Service
public class MatchGameServiceImpl extends ServiceImpl<MatchGameMapper, MatchGame> implements MatchGameService {

    @Autowired
    private MatchGoalService goalService;

    @Autowired
    private MatchScoreLogMapper scoreLogMapper;

    @Autowired
    private SseManager sseManager;

    @Autowired
    @Lazy
    private RatingService ratingService;

    @Autowired
    @Lazy
    private MatchService matchService;

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private GameParticipantService participantService;

    @Autowired
    private PlayerService playerService;

    private static final int LOCK_TIMEOUT_MINUTES = 5;

    private Long getCurrentUserId() {
        Object principal = SecurityUtils.getSubject().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }

    private void logAndBroadcast(MatchGame game, String type) {
        MatchScoreLog log = new MatchScoreLog();
        log.setGameId(game.getId());
        log.setScoreA(game.getScoreA());
        log.setScoreB(game.getScoreB());
        log.setType(type);
        log.setCreatedAt(LocalDateTime.now());
        scoreLogMapper.insert(log);
        sseManager.broadcastToMatch(game.getMatchId(), game);
    }

    private void checkLock(MatchGame game) {
        Long currentUserId = getCurrentUserId();
        if (game.getLockUserId() != null) {
            if (game.getLockTime().plusMinutes(LOCK_TIMEOUT_MINUTES).isAfter(LocalDateTime.now())
                    && !game.getLockUserId().equals(currentUserId)) {
                throw new IllegalStateException("当前比赛正在被其他球员录入比分，请稍后再试");
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean tryLockGame(Long gameId) {
        MatchGame game = this.getById(gameId);
        if (game == null) return false;
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) return false;
        if (game.getLockUserId() == null 
                || game.getLockTime().plusMinutes(LOCK_TIMEOUT_MINUTES).isBefore(LocalDateTime.now())
                || game.getLockUserId().equals(currentUserId)) {
            game.setLockUserId(currentUserId);
            game.setLockTime(LocalDateTime.now());
            return this.updateById(game);
        }
        return false;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unlockGame(Long gameId) {
        MatchGame game = this.getById(gameId);
        if (game != null && game.getLockUserId() != null && game.getLockUserId().equals(getCurrentUserId())) {
            game.setLockUserId(null);
            game.setLockTime(null);
            this.updateById(game);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MatchGame startGame(Long gameId, LocalDateTime actualStartTime) {
        MatchGame game = this.getById(gameId);
        if (game == null) throw new IllegalArgumentException("场次不存在");
        if (!"READY".equals(game.getStatus())) throw new IllegalStateException("只有 READY 状态的场次才能开始");

        Match match = matchService.getById(game.getMatchId());
        if (match == null || !Match.STATUS_ONGOING.equals(match.getStatus())) {
            throw new IllegalStateException("赛事不在进行中，无法开始场次");
        }

        checkParticipantPermission(game.getMatchId());

        long playingCount = this.count(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, game.getMatchId())
                .eq(MatchGame::getStatus, "PLAYING"));
        if (playingCount > 0) throw new IllegalStateException("同一赛事中同一时刻只允许一个场次处于进行中");

        Long currentUserId = getCurrentUserId();
        LocalDateTime start = actualStartTime != null ? actualStartTime : LocalDateTime.now();
        int duration = (match.getDurationPerGame() != null && match.getDurationPerGame() > 0)
                ? match.getDurationPerGame() : 10;
        game.setStartTime(start);
        game.setEndTime(start.plusMinutes(duration));
        game.setStatus("PLAYING");
        game.setScoreA(0);
        game.setScoreB(0);
        game.setOvertimeMinutes(0);
        game.setUpdatedBy(currentUserId);
        this.updateById(game);

        autoFillParticipants(game);
        logAndBroadcast(game, "STARTED");
        return game;
    }

    private void checkParticipantPermission(Long matchId) {
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) throw new IllegalStateException("请先登录");
        Player player = playerService.getByUserId(currentUserId);
        if (player == null) throw new IllegalStateException("未找到球员档案");
        MatchRegistration reg = registrationService.getOne(
                new LambdaQueryWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, player.getId())
                        .eq(MatchRegistration::getStatus, "REGISTERED"));
        if (reg == null) throw new IllegalStateException("您未参加本场赛事，无法操作");
    }

    private void autoFillParticipants(MatchGame game) {
        List<MatchRegistration> regs = registrationService.list(
                new LambdaQueryWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, game.getMatchId())
                        .eq(MatchRegistration::getStatus, "REGISTERED")
                        .in(MatchRegistration::getGroupIndex, game.getTeamAIndex(), game.getTeamBIndex()));

        List<GameParticipant> participants = regs.stream().map(r -> {
            GameParticipant p = new GameParticipant();
            p.setGameId(game.getId());
            p.setPlayerId(r.getPlayerId());
            p.setGoals(0);
            p.setAssists(0);
            p.setIsMvp(false);
            return p;
        }).collect(Collectors.toList());

        if (!participants.isEmpty()) {
            participantService.saveBatch(participants);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MatchGame addOvertime(Long gameId, int extraMinutes) {
        MatchGame game = this.getById(gameId);
        if (game != null) {
            game.setOvertimeMinutes(game.getOvertimeMinutes() + extraMinutes);
            if (game.getEndTime() != null) {
                game.setEndTime(game.getEndTime().plusMinutes(extraMinutes));
            }
            game.setUpdatedBy(getCurrentUserId());
            this.updateById(game);
        }
        return game;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recordGoal(MatchGoal goal) {
        MatchGame game = this.getById(goal.getGameId());
        if (game == null) return;
        checkLock(game);
        Long currentUserId = getCurrentUserId();
        if (goal.getOccurredAt() == null) goal.setOccurredAt(LocalDateTime.now());
        goal.setCreatedBy(currentUserId);
        goal.setUpdatedBy(currentUserId);
        goalService.save(goal);
        if (goal.getTeamIndex() == 0) game.setScoreA(game.getScoreA() + 1);
        else game.setScoreB(game.getScoreB() + 1);
        game.setUpdatedBy(currentUserId);
        this.updateById(game);
        logAndBroadcast(game, "GOAL");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateScoreManually(Long gameId, int scoreA, int scoreB) {
        MatchGame game = this.getById(gameId);
        if (game == null) return;
        checkLock(game);
        Long currentUserId = getCurrentUserId();
        game.setScoreA(scoreA);
        game.setScoreB(scoreB);
        game.setUpdatedBy(currentUserId);
        game.setLockUserId(null);
        game.setLockTime(null);
        this.updateById(game);
        logAndBroadcast(game, "MANUAL");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishGame(Long gameId, LocalDateTime actualEndTime) {
        MatchGame game = this.getById(gameId);
        if (game == null) throw new IllegalArgumentException("场次不存在");
        if (!"PLAYING".equals(game.getStatus())) throw new IllegalStateException("只有进行中的场次才能结束");

        Match match = matchService.getById(game.getMatchId());
        checkParticipantPermission(game.getMatchId());

        LocalDateTime end = actualEndTime != null ? actualEndTime : LocalDateTime.now();
        if (game.getStartTime() != null) {
            int duration = (match != null && match.getDurationPerGame() != null && match.getDurationPerGame() > 0)
                    ? match.getDurationPerGame() : 10;
            long playTime = java.time.Duration.between(game.getStartTime(), end).toMinutes();
            int ot = (int) (playTime - duration);
            if (ot < 0) ot = 0;
            game.setOvertimeMinutes(ot);
        }
        game.setEndTime(end);

        game.setStatus("FINISHED");
        game.setLockUserId(null);
        game.setLockTime(null);
        game.setUpdatedBy(getCurrentUserId());
        this.updateById(game);

        ratingService.settleGameRating(gameId);
        logAndBroadcast(game, "FINISHED");
    }

    @Override
    public List<MatchScoreLog> getScoreLogs(Long gameId) {
        return scoreLogMapper.selectList(new LambdaQueryWrapper<MatchScoreLog>()
                .eq(MatchScoreLog::getGameId, gameId)
                .orderByDesc(MatchScoreLog::getCreatedAt));
    }

    @Override
    public List<MatchGame> listByMatchId(Long matchId) {
        return this.list(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, matchId)
                .orderByAsc(MatchGame::getGameIndex));
    }

    @Override
    public GameDetailVO getGameDetail(Long gameId) {
        MatchGame game = this.getById(gameId);
        if (game == null) throw new IllegalArgumentException("场次不存在");

        Match match = matchService.getById(game.getMatchId());

        List<GameParticipant> allParticipants = participantService.listByGameId(gameId);
        List<MatchGoal> goals = goalService.listByGameId(gameId);

        List<Long> playerIds = allParticipants.stream().map(GameParticipant::getPlayerId).collect(Collectors.toList());
        List<Long> scorerIds = goals.stream()
                .filter(g -> g.getScorerId() != null).map(MatchGoal::getScorerId).collect(Collectors.toList());
        List<Long> assistIds = goals.stream()
                .filter(g -> g.getAssistantId() != null).map(MatchGoal::getAssistantId).collect(Collectors.toList());
        List<Long> allPlayerIds = new ArrayList<>(playerIds);
        allPlayerIds.addAll(scorerIds);
        allPlayerIds.addAll(assistIds);
        allPlayerIds = allPlayerIds.stream().distinct().collect(Collectors.toList());

        final java.util.Map<Long, String> nameMap = new java.util.HashMap<>();
        if (!allPlayerIds.isEmpty()) {
            playerService.listByIds(allPlayerIds).forEach(p -> nameMap.put(p.getId(), p.getNickname()));
        }

        List<GameDetailVO.ParticipantInfo> teamAList = allParticipants.stream()
                .filter(p -> isInGroup(p, game.getMatchId(), game.getTeamAIndex()))
                .map(p -> new GameDetailVO.ParticipantInfo(
                        p.getId(), p.getPlayerId(), nameMap.getOrDefault(p.getPlayerId(), "球员#" + p.getPlayerId()),
                        null, p.getGoals(), p.getAssists(), p.getIsMvp()))
                .collect(Collectors.toList());

        List<GameDetailVO.ParticipantInfo> teamBList = allParticipants.stream()
                .filter(p -> isInGroup(p, game.getMatchId(), game.getTeamBIndex()))
                .map(p -> new GameDetailVO.ParticipantInfo(
                        p.getId(), p.getPlayerId(), nameMap.getOrDefault(p.getPlayerId(), "球员#" + p.getPlayerId()),
                        null, p.getGoals(), p.getAssists(), p.getIsMvp()))
                .collect(Collectors.toList());

        List<GameDetailVO.GoalInfo> goalInfos = goals.stream()
                .sorted(java.util.Comparator.comparing(g -> g.getOccurredAt() != null ? g.getOccurredAt() : LocalDateTime.MIN))
                .map(g -> new GameDetailVO.GoalInfo(
                        g.getId(), g.getTeamIndex(),
                        g.getScorerId(), g.getScorerId() != null ? nameMap.getOrDefault(g.getScorerId(), "未知") : null,
                        g.getAssistantId(), g.getAssistantId() != null ? nameMap.getOrDefault(g.getAssistantId(), "未知") : null,
                        g.getType(), g.getOccurredAt()))
                .collect(Collectors.toList());

        GameDetailVO vo = new GameDetailVO();
        vo.setGameId(game.getId());
        vo.setMatchId(game.getMatchId());
        vo.setTeamAIndex(game.getTeamAIndex());
        vo.setTeamBIndex(game.getTeamBIndex());
        vo.setTeamNames(match != null ? match.getTeamNames() : null);
        vo.setScoreA(game.getScoreA());
        vo.setScoreB(game.getScoreB());
        vo.setStatus(game.getStatus());
        vo.setStartTime(game.getStartTime());
        vo.setEndTime(game.getEndTime());
        vo.setOvertimeMinutes(game.getOvertimeMinutes());
        vo.setGameIndex(game.getGameIndex());
        vo.setMatchStartTime(match != null ? match.getStartTime() : null);
        vo.setDurationPerGame(match != null ? match.getDurationPerGame() : null);
        vo.setTeamAParticipants(teamAList);
        vo.setTeamBParticipants(teamBList);
        vo.setGoals(goalInfos);
        return vo;
    }

    private boolean isInGroup(GameParticipant participant, Long matchId, Integer groupIndex) {
        MatchRegistration reg = registrationService.getOne(
                new LambdaQueryWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, participant.getPlayerId()));
        return reg != null && groupIndex.equals(reg.getGroupIndex());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addParticipant(Long gameId, Long playerId) {
        long exists = participantService.count(new LambdaQueryWrapper<GameParticipant>()
                .eq(GameParticipant::getGameId, gameId)
                .eq(GameParticipant::getPlayerId, playerId));
        if (exists > 0) return;
        GameParticipant p = new GameParticipant();
        p.setGameId(gameId);
        p.setPlayerId(playerId);
        p.setGoals(0);
        p.setAssists(0);
        p.setIsMvp(false);
        participantService.save(p);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeParticipant(Long gameId, Long playerId) {
        participantService.remove(new LambdaQueryWrapper<GameParticipant>()
                .eq(GameParticipant::getGameId, gameId)
                .eq(GameParticipant::getPlayerId, playerId));
    }

    @Override
    public List<GameParticipant> listParticipants(Long gameId) {
        return participantService.listByGameId(gameId);
    }
}