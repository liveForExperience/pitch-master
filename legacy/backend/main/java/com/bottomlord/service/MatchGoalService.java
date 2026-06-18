package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.MatchGoal;

import java.util.List;

/**
 * 进球记录服务接口
 *
 * @author Gemini
 */
public interface MatchGoalService extends IService<MatchGoal> {

    /**
     * 获取指定比赛的所有进球记录
     *
     * @param gameId 比赛ID
     * @return 进球记录列表
     */
    List<MatchGoal> listByGameId(Long gameId);

    /**
     * 更新进球详情 (用于补充占位信息)
     *
     * @param goalId 进球记录ID
     * @param scorerId 进球人ID
     * @param assistantId 助攻人ID
     * @param type 进球类型
     */
    void updateGoalDetails(Long goalId, Long scorerId, Long assistantId, String type);

    /**
     * 统计某支球队在某场比赛中的进球数
     *
     * @param gameId 比赛ID
     * @param teamIndex 球队序号
     * @return 进球总数
     */
    long countByTeam(Long gameId, int teamIndex);
}
