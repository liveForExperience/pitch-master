package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.Tournament;

import java.util.List;

/**
 * Tournament 服务接口
 */
public interface TournamentService extends IService<Tournament> {

    /**
     * 列出所有活跃的 Tournament
     */
    List<Tournament> listActive();

    /**
     * 平台管理员创建 Tournament
     */
    Tournament createTournament(Tournament tournament);

    /**
     * 任命 Tournament 管理员
     */
    void addAdmin(Long tournamentId, Long userId);

    /**
     * 移除 Tournament 管理员
     */
    void removeAdmin(Long tournamentId, Long userId);

    /**
     * 判断用户是否为指定 Tournament 的管理员（或平台管理员）
     */
    boolean isAdmin(Long tournamentId, Long userId);

    /**
     * 判断用户是否为平台管理员
     */
    boolean isPlatformAdmin(Long userId);

    /**
     * 获取用户管理的 Tournament ID 列表
     */
    List<Long> getAdminTournamentIds(Long userId);
}
