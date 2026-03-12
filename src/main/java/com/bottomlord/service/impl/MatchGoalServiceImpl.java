package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.mapper.MatchGoalMapper;
import com.bottomlord.service.MatchGoalService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 进球记录服务实现类
 *
 * @author Gemini
 */
@Service
public class MatchGoalServiceImpl extends ServiceImpl<MatchGoalMapper, MatchGoal> implements MatchGoalService {

    @Override
    public List<MatchGoal> listByGameId(Long gameId) {
        return baseMapper.selectList(new LambdaQueryWrapper<MatchGoal>()
                .eq(MatchGoal::getGameId, gameId)
                .orderByAsc(MatchGoal::getOccurredAt));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateGoalDetails(Long goalId, Long scorerId, Long assistantId, String type) {
        MatchGoal goal = this.getById(goalId);
        if (goal != null) {
            goal.setScorerId(scorerId);
            goal.setAssistantId(assistantId);
            if (type != null) {
                goal.setType(type);
            }
            this.updateById(goal);
        }
    }

    @Override
    public long countByTeam(Long gameId, int teamIndex) {
        return baseMapper.selectCount(new LambdaQueryWrapper<MatchGoal>()
                .eq(MatchGoal::getGameId, gameId)
                .eq(MatchGoal::getTeamIndex, teamIndex));
    }
}
