package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.common.util.SseManager;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.entity.MatchScoreLog;
import com.bottomlord.entity.User;
import com.bottomlord.mapper.MatchGameMapper;
import com.bottomlord.mapper.MatchScoreLogMapper;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchGoalService;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    private static final int LOCK_TIMEOUT_MINUTES = 5;

    private Long getCurrentUserId() {
        Object principal = SecurityUtils.getSubject().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }

    private void logAndBroadcast(MatchGame game, String type) {
        // 1. 记录审计日志
        MatchScoreLog log = new MatchScoreLog();
        log.setGameId(game.getId());
        log.setScoreA(game.getScoreA());
        log.setScoreB(game.getScoreB());
        log.setOperatorId(getCurrentUserId());
        log.setType(type);
        log.setCreatedAt(LocalDateTime.now());
        scoreLogMapper.insert(log);

        // 2. 实时广播 (推送给该赛事下的所有监听者)
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
        if (game != null && game.getLockUserId().equals(getCurrentUserId())) {
            game.setLockUserId(null);
            game.setLockTime(null);
            this.updateById(game);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MatchGame startGame(Long gameId, int durationMinutes) {
        MatchGame game = this.getById(gameId);
        if (game != null) {
            LocalDateTime now = LocalDateTime.now();
            game.setStartTime(now);
            game.setEndTime(now.plusMinutes(durationMinutes));
            game.setStatus("PLAYING");
            game.setScoreA(0);
            game.setScoreB(0);
            game.setUpdatedBy(getCurrentUserId());
            this.updateById(game);
        }
        return game;
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
        if (goal.getOccurredAt() == null) {
            goal.setOccurredAt(LocalDateTime.now());
        }
        goal.setCreatedBy(currentUserId);
        goal.setUpdatedBy(currentUserId);
        goalService.save(goal);

        if (goal.getTeamIndex() == 0) {
            game.setScoreA(game.getScoreA() + 1);
        } else {
            game.setScoreB(game.getScoreB() + 1);
        }
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

        long currentA = goalService.countByTeam(gameId, 0);
        if (scoreA > currentA) {
            for (int i = 0; i < (scoreA - currentA); i++) {
                createPlaceholderGoal(gameId, 0, currentUserId);
            }
        }

        long currentB = goalService.countByTeam(gameId, 1);
        if (scoreB > currentB) {
            for (int i = 0; i < (scoreB - currentB); i++) {
                createPlaceholderGoal(gameId, 1, currentUserId);
            }
        }

        game.setScoreA(scoreA);
        game.setScoreB(scoreB);
        game.setUpdatedBy(currentUserId);
        game.setLockUserId(null);
        game.setLockTime(null);
        this.updateById(game);

        logAndBroadcast(game, "MANUAL");
    }

    private void createPlaceholderGoal(Long gameId, int teamIndex, Long operatorId) {
        MatchGoal placeholder = new MatchGoal();
        placeholder.setGameId(gameId);
        placeholder.setTeamIndex(teamIndex);
        placeholder.setScorerId(null);
        placeholder.setType("NORMAL");
        placeholder.setOccurredAt(LocalDateTime.now());
        placeholder.setCreatedBy(operatorId);
        placeholder.setUpdatedBy(operatorId);
        goalService.save(placeholder);
    }

    @Override
    public void finishGame(Long gameId) {
        MatchGame game = this.getById(gameId);
        if (game != null) {
            game.setStatus("FINISHED");
            game.setLockUserId(null);
            game.setLockTime(null);
            this.updateById(game);
        }
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
                .eq(MatchGame::getMatchId, matchId));
    }
}
