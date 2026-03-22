package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.dto.GroupingRequest;
import com.bottomlord.dto.GroupsVO;
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
     * 更新赛事信息（仅限 PREPARING 状态）
     *
     * @param matchId 赛事ID
     * @param match 更新的赛事信息
     * @return 更新后的赛事
     */
    Match updateMatch(Long matchId, Match match);

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
     * 批准待审批的报名（管理员操作，PENDING -> REGISTERED）
     *
     * @param matchId 赛事ID
     * @param playerId 球员ID
     */
    void approveRegistration(Long matchId, Long playerId);

    /**
     * 拒绝待审批的报名（管理员操作，PENDING -> CANCELLED）
     *
     * @param matchId 赛事ID
     * @param playerId 球员ID
     */
    void rejectRegistration(Long matchId, Long playerId);

    /**
     * 自动生成分组草稿并持久化（groups_published=false，不改变赛事状态）。
     * 可从 PUBLISHED / REGISTRATION_CLOSED 触发。
     *
     * @param matchId 赛事ID
     * @param request 分组请求（策略名称、是否保留已有分配）
     * @return 分组 VO（含球员详情）
     */
    GroupsVO confirmAndGroup(Long matchId, GroupingRequest request);

    /**
     * 获取所有可用分组策略名称列表
     *
     * @return 策略名称列表
     */
    List<String> listGroupingStrategies();

    /**
     * 获取分组数据。
     * 非管理员仅能获取已发布（groups_published=true）的分组；管理员始终可见。
     *
     * @param matchId 赛事ID
     * @param isAdmin 是否管理员
     * @return 分组 VO，若无权或未分组则返回 null
     */
    GroupsVO getGroups(Long matchId, boolean isAdmin);

    /**
     * 发布分组（groups_published=false -> true）。
     * 要求所有有效报名球员均已分配组别。
     *
     * @param matchId 赛事ID
     */
    void publishGroups(Long matchId);

    /**
     * 保存管理员手动调整的分组草稿（仅限 admin）
     *
     * @param matchId 赛事ID
     * @param manualGroups 新的分组结果
     */
    void adjustGroupsManually(Long matchId, Map<Integer, List<Long>> manualGroups);

    /**
     * 正式开赛（进入 ONGOING 状态，生成场次）。
     * 要求分组已发布（groups_published=true）。
     *
     * @param matchId 赛事ID
     * @param actualStartTime 实际开赛时间（管理员设置）
     */
    void startMatch(Long matchId, LocalDateTime actualStartTime);

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

    /**
     * 更新某支队伍的自定义名称（仅限 admin，仅在 PUBLISHED / REGISTRATION_CLOSED 状态下允许）
     *
     * @param matchId    赛事ID
     * @param groupIndex 队伍组号（0-N）
     * @param name       自定义名称
     */
    void updateTeamName(Long matchId, Integer groupIndex, String name);

    /**
     * 回退赛事状态（仅限管理员）
     * 允许从 ONGOING 回退到 REGISTRATION_CLOSED 或 GROUPING_DRAFT
     *
     * @param matchId 赛事ID
     * @param targetStatus 目标状态
     */
    void rollbackMatchStatus(Long matchId, String targetStatus);

    /**
     * 更新实际开赛时间（仅限管理员，仅在 ONGOING 状态）
     *
     * @param matchId 赛事ID
     * @param actualStartTime 新的实际开赛时间
     */
    void updateActualStartTime(Long matchId, LocalDateTime actualStartTime);

    /**
     * 软删除赛事（任何状态均可删除，仅限管理员）
     *
     * @param matchId 赛事ID
     * @param userId 删除操作人用户ID
     */
    void softDeleteMatch(Long matchId, Long userId);

    /**
     * 获取回收站赛事列表（仅限管理员）
     *
     * @return 已软删除的赛事列表
     */
    List<Match> listTrashedMatches();

    /**
     * 物理删除赛事及关联数据（仅限管理员）
     *
     * @param matchId 赛事ID
     */
    void permanentDeleteMatch(Long matchId);

    /**
     * 恢复软删除的赛事（仅限管理员）
     *
     * @param matchId 赛事ID
     */
    void restoreMatch(Long matchId);
}
