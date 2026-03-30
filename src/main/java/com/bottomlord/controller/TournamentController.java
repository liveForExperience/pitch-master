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

    private User getCurrentUser() {
        return (User) SecurityUtils.getSubject().getPrincipal();
    }
}
