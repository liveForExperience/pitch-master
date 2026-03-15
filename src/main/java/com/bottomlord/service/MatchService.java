package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.Match;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

/**
 * 赛事服务接口
 *
 * @author Gemini
 */
public interface MatchService extends IService<Match> {

    /**
     * 获取赛事详情（含时间驱动的状态同步）
     *
     * @param matchId 赛事ID
     * @return 状态已同步的赛事实体
     */
    Match getMatchDetail(Long matchId);

    /**
     * 获取近期赛事列表
     *
     * @return 赛事列表
     */
    List<Match> listUpcomingMatches();

    /**
     * 发布新赛事（仅限 admin，初始状态为 PREPARING）
     *
     * @param match 赛事基本信息
     * @return 发布成功的赛事
     */
    Match publishMatch(Match match);

    /**
     * 开始报名（状态：PREPARING -> PUBLISHED）
     *
     * @param matchId 赛事ID
     */
    void startRegistration(Long matchId);

    /**
     * 撤回至筹备阶段（状态：PUBLISHED -> PREPARING）
     *
     * @param matchId 赛事ID
     */
    void revertToPreparing(Long matchId);

    /**
     * 更新报名截止时间（支持从 REGISTRATION_CLOSED 回退至 PUBLISHED）
     *
     * @param matchId 赛事ID
     * @param newDeadline 新s的截止时间
     */
    void updateRegistrationDeadline(Long matchId, LocalDateTime newDeadline);

    /**
     * 删除赛事（仅限 PREPARING 状态）
     *
     * @param matchId 赛事ID
     */
    void deleteMatch(Long matchId);

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
     * 生成分组草稿（进入 GROUPING_DRAFT 状态）
     *
     * @param matchId 赛事ID
     * @return 分组结果：组号 -> 球员ID列表
     */
    Map<Integer, List<Long>> confirmAndGroup(Long matchId);

    /**
     * 确认最终分组并正式开赛（进入 ONGOING 状态，生成场次）
     *
     * @param matchId 赛事ID
     * @param finalGroups 最终确认的分组
     */
    void startWithGroups(Long matchId, Map<Integer, List<Long>> finalGroups);

    /**
     * 管理员手动调整分组（仅限 admin）
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

    /**
     * 结算费用并更新支付状态
     *
     * @param matchId 赛事ID
     */
    void settleFees(Long matchId);
}
