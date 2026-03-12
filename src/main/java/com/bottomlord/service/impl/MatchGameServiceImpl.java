package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.mapper.MatchGameMapper;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchGoalService;
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
            // 预计结束时间相应顺延
            if (game.getEndTime() != null) {
                game.setEndTime(game.getEndTime().plusMinutes(extraMinutes));
            }
            this.updateById(game);
        }
        return game;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recordGoal(MatchGoal goal) {
        // 1. 保存进球记录
        if (goal.getOccurredAt() == null) {
            goal.setOccurredAt(LocalDateTime.now());
        }
        goalService.save(goal);

        // 2. 自动更新场次比分
        MatchGame game = this.getById(goal.getGameId());
        if (game != null) {
            if (goal.getTeamIndex() == 0) {
                game.setScoreA(game.getScoreA() + 1);
            } else {
                game.setScoreB(game.getScoreB() + 1);
            }
            this.updateById(game);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateScoreManually(Long gameId, int scoreA, int scoreB) {
        MatchGame game = this.getById(gameId);
        if (game == null) return;

        // 处理 A 队占位
        long currentA = goalService.countByTeam(gameId, 0);
        if (scoreA > currentA) {
            for (int i = 0; i < (scoreA - currentA); i++) {
                createPlaceholderGoal(gameId, 0);
            }
        }

        // 处理 B 队占位
        long currentB = goalService.countByTeam(gameId, 1);
        if (scoreB > currentB) {
            for (int i = 0; i < (scoreB - currentB); i++) {
                createPlaceholderGoal(gameId, 1);
            }
        }

        game.setScoreA(scoreA);
        game.setScoreB(scoreB);
        this.updateById(game);
    }

    private void createPlaceholderGoal(Long gameId, int teamIndex) {
        MatchGoal placeholder = new MatchGoal();
        placeholder.setGameId(gameId);
        placeholder.setTeamIndex(teamIndex);
        placeholder.setScorerId(null); // 未知
        placeholder.setType("NORMAL");
        placeholder.setOccurredAt(LocalDateTime.now());
        goalService.save(placeholder);
    }

    @Override
    public void finishGame(Long gameId) {
        MatchGame game = this.getById(gameId);
        if (game != null) {
            game.setStatus("FINISHED");
            this.updateById(game);
        }
    }

    @Override
    public List<MatchGame> listByMatchId(Long matchId) {
        return this.list(new LambdaQueryWrapper<MatchGame>()
                .eq(MatchGame::getMatchId, matchId));
    }
}
