package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.Tournament;
import com.bottomlord.entity.User;

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

    /**
     * 获取指定 Tournament 的所有管理员用户（脱敏）
     */
    List<User> listAdminUsers(Long tournamentId);

    /**
     * 软删除 Tournament（仅平台管理员）
     */
    void softDeleteTournament(Long tournamentId, Long userId);

    /**
     * 获取回收站中的 Tournament 列表（仅平台管理员）
     */
    List<Tournament> listTrashedTournaments();

    /**
     * 从回收站恢复 Tournament（仅平台管理员）
     */
    void restoreTournament(Long tournamentId);

    /**
     * 物理删除 Tournament 及所有关联数据（仅平台管理员，不可恢复）
     */
    void permanentDeleteTournament(Long tournamentId);

    /**
     * 列出 Tournament 下所有活跃/待审批成员的用户视图
     */
    List<User> listMembers(Long tournamentId);

    /**
     * 批量添加用户到 Tournament（按 userId 列表）
     */
    List<String> batchAddMembers(Long tournamentId, List<Long> userIds);

    /**
     * 移除 Tournament 成员（按 userId）
     */
    void removeMember(Long tournamentId, Long userId);
}
