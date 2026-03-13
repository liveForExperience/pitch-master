package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.MatchEvent;

import java.util.List;
import java.util.Map;

/**
 * 赛事服务接口
 *
 * @author Gemini
 */
public interface MatchEventService extends IService<MatchEvent> {

    /**
     * 获取近期赛事列表
     *
     * @return 赛事列表
     */
    List<MatchEvent> listUpcomingMatches();

    /**
     * 发布新赛事（仅限 ADMIN）
     *
     * @param match 赛事基本信息
     * @return 发布成功的赛事
     */
    MatchEvent publishMatch(MatchEvent match);

    /**
     * 球员报名
     *
     * @param matchId 赛事ID
     * @param playerId 球员ID
     */
    void registerForMatch(Long matchId, Long playerId);

    /**
     * 取消报名 (含反悔逻辑)
     */
    void cancelRegistration(Long matchId, Long playerId);

    /**
     * 确认并启动赛事（触发自动分组逻辑）
     *
     * @param matchId 赛事ID
     * @return 分组结果：组号 -> 球员ID列表
     */
    Map<Integer, List<Long>> confirmAndGroup(Long matchId);

    /**
     * 管理员手动调整分组（仅限 ADMIN）
     *
     * @param matchId 赛事ID
     * @param manualGroups 新的分组结果
     */
    void adjustGroupsManually(Long matchId, Map<Integer, List<Long>> manualGroups);

    /**
     * 完成赛事并结算费用
     *
     * @param matchId 赛事ID
     */
    void finishMatch(Long matchId);
}
