package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.TournamentPlayer;

import java.util.List;

/**
 * 球员-Tournament 注册关系服务接口
 */
public interface TournamentPlayerService extends IService<TournamentPlayer> {

    /**
     * 球员加入 Tournament
     * @param tournamentId Tournament ID
     * @param playerId 球员 ID（全局）
     * @return 创建的注册记录
     */
    TournamentPlayer join(Long tournamentId, Long playerId);

    /**
     * 球员退出 Tournament
     */
    void leave(Long tournamentId, Long playerId);

    /**
     * 管理员审批球员加入（APPROVAL 模式）
     */
    void approve(Long tournamentId, Long playerId);

    /**
     * 管理员拒绝球员加入（APPROVAL 模式）
     */
    void reject(Long tournamentId, Long playerId);

    /**
     * 管理员直接添加球员到 Tournament
     */
    TournamentPlayer adminAddPlayer(Long tournamentId, Long playerId);

    /**
     * 列出 Tournament 下所有活跃球员
     */
    List<TournamentPlayer> listActiveByTournament(Long tournamentId);

    /**
     * 获取球员在指定 Tournament 下的注册记录
     */
    TournamentPlayer getByTournamentAndPlayer(Long tournamentId, Long playerId);

    /**
     * 获取用户已加入的 Tournament ID 列表（通过 player_id 关联）
     */
    List<Long> getJoinedTournamentIds(Long playerId);
}
