package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.Tournament;
import com.bottomlord.entity.TournamentPlayer;
import com.bottomlord.entity.User;
import com.bottomlord.service.PlayerService;
import com.bottomlord.service.TournamentPlayerService;
import com.bottomlord.service.TournamentService;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Tournament 管理控制器
 */
@RestController
@RequestMapping("/api/tournament")
public class TournamentController {

    @Autowired
    private TournamentService tournamentService;

    @Autowired
    private TournamentPlayerService tournamentPlayerService;

    @Autowired
    private PlayerService playerService;

    /**
     * 列出所有活跃 Tournament
     */
    @GetMapping("/list")
    public Result<List<Tournament>> list() {
        return Result.success(tournamentService.listActive());
    }

    /**
     * 获取单个 Tournament 详情
     */
    @GetMapping("/{id}")
    public Result<Tournament> getById(@PathVariable Long id) {
        Tournament tournament = tournamentService.getById(id);
        if (tournament == null) {
            return Result.error(404, "Tournament 不存在");
        }
        return Result.success(tournament);
    }

    /**
     * 创建 Tournament（仅平台管理员）
     */
    @PostMapping
    public Result<Tournament> create(@RequestBody Tournament tournament) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可创建 Tournament");
        }
        return Result.success(tournamentService.createTournament(tournament));
    }

    /**
     * 任命 Tournament 管理员（仅平台管理员）
     */
    @PostMapping("/{tournamentId}/admin")
    public Result<Void> addAdmin(@PathVariable Long tournamentId, @RequestParam Long userId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可任命 Tournament 管理员");
        }
        tournamentService.addAdmin(tournamentId, userId);
        return Result.success();
    }

    /**
     * 移除 Tournament 管理员（仅平台管理员）
     */
    @DeleteMapping("/{tournamentId}/admin")
    public Result<Void> removeAdmin(@PathVariable Long tournamentId, @RequestParam Long userId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可移除 Tournament 管理员");
        }
        tournamentService.removeAdmin(tournamentId, userId);
        return Result.success();
    }

    /**
     * 获取 Tournament 当前管理员列表（仅平台管理员）
     */
    @GetMapping("/{tournamentId}/admins")
    public Result<List<User>> listAdmins(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可查看");
        }
        List<User> admins = tournamentService.listAdminUsers(tournamentId);
        admins.forEach(u -> {
            u.setPassword(null);
            u.setSalt(null);
        });
        return Result.success(admins);
    }

    /**
     * 球员加入 Tournament
     */
    @PostMapping("/{tournamentId}/join")
    public Result<TournamentPlayer> join(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        Player player = playerService.getByUserId(currentUser.getId());
        if (player == null) {
            return Result.error(400, "请先完成球员注册");
        }
        return Result.success(tournamentPlayerService.join(tournamentId, player.getId()));
    }

    /**
     * 球员退出 Tournament
     */
    @PostMapping("/{tournamentId}/leave")
    public Result<Void> leave(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        Player player = playerService.getByUserId(currentUser.getId());
        if (player == null) {
            return Result.error(400, "请先完成球员注册");
        }
        tournamentPlayerService.leave(tournamentId, player.getId());
        return Result.success();
    }

    /**
     * 管理员审批球员加入（APPROVAL 模式）
     */
    @PostMapping("/{tournamentId}/players/{playerId}/approve")
    public Result<Void> approve(@PathVariable Long tournamentId, @PathVariable Long playerId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可审批");
        }
        tournamentPlayerService.approve(tournamentId, playerId);
        return Result.success();
    }

    /**
     * 管理员拒绝球员加入（APPROVAL 模式）
     */
    @PostMapping("/{tournamentId}/players/{playerId}/reject")
    public Result<Void> reject(@PathVariable Long tournamentId, @PathVariable Long playerId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可审批");
        }
        tournamentPlayerService.reject(tournamentId, playerId);
        return Result.success();
    }

    /**
     * 管理员直接添加球员到 Tournament
     */
    @PostMapping("/{tournamentId}/players/{playerId}")
    public Result<TournamentPlayer> adminAddPlayer(@PathVariable Long tournamentId, @PathVariable Long playerId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可添加球员");
        }
        return Result.success(tournamentPlayerService.adminAddPlayer(tournamentId, playerId));
    }

    /**
     * 列出 Tournament 下所有活跃球员
     */
    @GetMapping("/{tournamentId}/players")
    public Result<List<TournamentPlayer>> listPlayers(@PathVariable Long tournamentId) {
        return Result.success(tournamentPlayerService.listActiveByTournament(tournamentId));
    }

    /**
     * 列出待审批球员（APPROVAL 模式）
     */
    @GetMapping("/{tournamentId}/players/pending")
    public Result<List<TournamentPlayer>> listPendingPlayers(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可查看");
        }
        return Result.success(tournamentPlayerService.list(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<TournamentPlayer>()
                        .eq(TournamentPlayer::getTournamentId, tournamentId)
                        .eq(TournamentPlayer::getJoinStatus, "PENDING")));
    }

    /**
     * 判断当前用户是否为指定 Tournament 的管理员
     */
    @GetMapping("/{tournamentId}/is-admin")
    public Result<Boolean> isAdmin(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        return Result.success(tournamentService.isAdmin(tournamentId, currentUser.getId()));
    }

    /**
     * 软删除 Tournament（仅平台管理员）
     */
    @DeleteMapping("/{id}/soft")
    public Result<Void> softDelete(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可删除 Tournament");
        }
        tournamentService.softDeleteTournament(id, currentUser.getId());
        return Result.success();
    }

    /**
     * 获取回收站 Tournament 列表（仅平台管理员）
     */
    @GetMapping("/trash")
    public Result<List<Tournament>> listTrash() {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可查看回收站");
        }
        return Result.success(tournamentService.listTrashedTournaments());
    }

    /**
     * 恢复软删除的 Tournament（仅平台管理员）
     */
    @PostMapping("/{id}/restore")
    public Result<Void> restore(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可恢复 Tournament");
        }
        tournamentService.restoreTournament(id);
        return Result.success();
    }

    /**
     * 物理删除 Tournament 及所有关联数据（仅平台管理员，不可恢复）
     */
    @DeleteMapping("/{id}/permanent")
    public Result<Void> permanentDelete(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isPlatformAdmin(currentUser.getId())) {
            return Result.error(403, "仅平台管理员可执行物理删除");
        }
        tournamentService.permanentDeleteTournament(id);
        return Result.success();
    }

    /**
     * 列出 Tournament 成员（tournament admin 可查看）
     */
    @GetMapping("/{tournamentId}/members")
    public Result<List<User>> listMembers(@PathVariable Long tournamentId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可查看成员");
        }
        List<User> members = tournamentService.listMembers(tournamentId);
        members.forEach(u -> {
            u.setPassword(null);
            u.setSalt(null);
        });
        return Result.success(members);
    }

    /**
     * 批量添加用户到 Tournament（tournament admin 权限）
     */
    @PostMapping("/{tournamentId}/members/batch")
    public Result<List<String>> batchAddMembers(@PathVariable Long tournamentId,
                                                @RequestBody Map<String, List<Long>> body) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可添加成员");
        }
        List<Long> userIds = body.get("userIds");
        if (userIds == null || userIds.isEmpty()) {
            return Result.error(400, "userIds 不能为空");
        }
        List<String> skipped = tournamentService.batchAddMembers(tournamentId, userIds);
        return Result.success(skipped);
    }

    /**
     * 移除 Tournament 成员（tournament admin 权限）
     */
    @DeleteMapping("/{tournamentId}/members/{userId}")
    public Result<Void> removeMember(@PathVariable Long tournamentId, @PathVariable Long userId) {
        User currentUser = getCurrentUser();
        if (!tournamentService.isAdmin(tournamentId, currentUser.getId())) {
            return Result.error(403, "仅 Tournament 管理员可移除成员");
        }
        tournamentService.removeMember(tournamentId, userId);
        return Result.success();
    }

    private User getCurrentUser() {
        return (User) SecurityUtils.getSubject().getPrincipal();
    }
}
