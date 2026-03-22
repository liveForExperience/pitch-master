package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.dto.GameDetailVO;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;

import java.util.List;

/**
 * 具体比赛场次服务接口
 *
 * @author Gemini
 */
public interface MatchGameService extends IService<MatchGame> {

    /**
     * 开始比赛场次。
     * <p>
     * 前提条件：<br>
     * 1. 场次状态必须为 READY；<br>
     * 2. 所属赛事状态必须为 ONGOING；<br>
     * 3. 调用者必须已登录且已报名当前赛事（非 CANCELLED/NO_SHOW）；<br>
     * 4. 同一赛事中，同一时刻只允许一个场次处于 PLAYING 状态（互斥）。<br>
     * </p>
     * 开始时自动从分组报名数据填充 GAME_PARTICIPANT。
     *
     * @param gameId 场次ID
     * @return 更新后的场次信息
     */
    MatchGame startGame(Long gameId);

    /**
     * 添加比赛加时 (Injury Time)
     *
     * @param gameId 场次ID
     * @param extraMinutes 加时时长
     * @return 更新后的场次信息 (含新的预计结束时间)
     */
    MatchGame addOvertime(Long gameId, int extraMinutes);

    /**
     * 录入进球事件
     * <p>
     * 录入成功后，应自动更新 {@link MatchGame} 的比分。
     * </p>
     *
     * @param goal 进球事件详情 (含进球球员、助攻球员、乌龙标识)
     */
    void recordGoal(MatchGoal goal);

    /**
     * 手动修改比分
     * <p>
     * 如果修改后的比分与录入的进球事件数不一致，系统应自动记录为“未知事件”填充。
     * </p>
     *
     * @param gameId 场次ID
     * @param scoreA A队新比分
     * @param scoreB B队新比分
     */
    void updateScoreManually(Long gameId, int scoreA, int scoreB);

    /**
     * 尝试获取比分修改锁
     *
     * @param gameId 场次ID
     * @return 是否加锁成功
     */
    boolean tryLockGame(Long gameId);

    /**
     * 手动释放锁
     *
     * @param gameId 场次ID
     */
    void unlockGame(Long gameId);

    /**
     * 完成比赛场次
     *
     * @param gameId 场次ID
     */
    void finishGame(Long gameId);
    
    /**
     * 获取指定赛事的比分变动日志
     *
     * @param gameId 场次ID
     * @return 日志列表
     */
    List<com.bottomlord.entity.MatchScoreLog> getScoreLogs(Long gameId);

    /**
     * 获取指定赛事的所有比赛场次
     *
     * @param matchId 大赛事ID
     * @return 场次列表
     */
    List<MatchGame> listByMatchId(Long matchId);

    /**
     * 获取场次聚合详情（含赛事上下文、参赛人员、进球明细）
     *
     * @param gameId 场次ID
     * @return 场次详情 VO
     */
    GameDetailVO getGameDetail(Long gameId);

    /**
     * 管理员手动添加参赛球员
     *
     * @param gameId   场次ID
     * @param playerId 球员ID
     */
    void addParticipant(Long gameId, Long playerId);

    /**
     * 管理员手动移除参赛球员
     *
     * @param gameId   场次ID
     * @param playerId 球员ID
     */
    void removeParticipant(Long gameId, Long playerId);

    /**
     * 获取场次参赛球员列表（含球员基础信息）
     *
     * @param gameId 场次ID
     * @return 参赛球员列表
     */
    List<GameParticipant> listParticipants(Long gameId);
}
