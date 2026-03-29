package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.dto.GroupingRequest;
import com.bottomlord.dto.GroupsVO;
import com.bottomlord.dto.MatchStatsVO;
import com.bottomlord.dto.StandingsVO;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.User;
import com.bottomlord.exporter.MatchReportExporter;
import com.bottomlord.service.MatchArenaService;
import com.bottomlord.service.MatchService;
import com.bottomlord.service.MatchRegistrationService;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/match")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private MatchReportExporter reportExporter;

    @Autowired
    private MatchArenaService matchArenaService;

    @GetMapping("/list")
    public Result<List<Match>> listMatches() {
        return Result.success(matchService.listUpcomingMatches());
    }

    @GetMapping("/{id}")
    public Result<Match> getMatch(@PathVariable Long id) {
        return Result.success(matchService.getMatchDetail(id));
    }

    @PostMapping("/publish")
    public Result<Match> publishMatch(@RequestBody Match match) {
        return Result.success(matchService.publishMatch(match));
    }

    @PutMapping("/{id}")
    public Result<Match> updateMatch(@PathVariable Long id, @RequestBody Match match) {
        return Result.success(matchService.updateMatch(id, match));
    }

    @PostMapping("/{id}/publish")
    public Result<Void> startRegistration(@PathVariable Long id) {
        matchService.startRegistration(id);
        return Result.success();
    }

    @PostMapping("/{id}/revert-preparing")
    public Result<Void> revertToPreparing(@PathVariable Long id) {
        matchService.revertToPreparing(id);
        return Result.success();
    }

    @PostMapping("/{matchId}/register")
    public Result<Void> register(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.registerForMatch(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/cancel")
    public Result<Void> cancelRegistration(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.cancelRegistration(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/approve")
    public Result<Void> approveRegistration(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.approveRegistration(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/reject")
    public Result<Void> rejectRegistration(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.rejectRegistration(matchId, playerId);
        return Result.success();
    }

    @GetMapping("/{id}/pending")
    public Result<List<MatchRegistration>> listPendingRegistrations(@PathVariable Long id) {
        return Result.success(registrationService.getPendingRegistrations(id));
    }

    @GetMapping("/grouping/strategies")
    public Result<java.util.List<String>> listStrategies() {
        return Result.success(matchService.listGroupingStrategies());
    }

    @PostMapping("/{matchId}/group")
    public Result<GroupsVO> confirmAndGroup(@PathVariable Long matchId,
                                            @RequestBody(required = false) GroupingRequest request) {
        return Result.success(matchService.confirmAndGroup(matchId, request != null ? request : new GroupingRequest()));
    }

    @GetMapping("/{matchId}/groups")
    public Result<GroupsVO> getGroups(@PathVariable Long matchId) {
        boolean isAdmin = SecurityUtils.getSubject().hasRole("admin");
        return Result.success(matchService.getGroups(matchId, isAdmin));
    }

    @PutMapping("/{matchId}/groups")
    public Result<Void> adjustGroups(@PathVariable Long matchId, @RequestBody Map<Integer, List<Long>> groups) {
        matchService.adjustGroupsManually(matchId, groups);
        return Result.success();
    }

    @PostMapping("/{matchId}/groups/publish")
    public Result<Void> publishGroups(@PathVariable Long matchId) {
        matchService.publishGroups(matchId);
        return Result.success();
    }

    @PutMapping("/{matchId}/teams/{groupIndex}/name")
    public Result<Void> updateTeamName(@PathVariable Long matchId,
                                       @PathVariable Integer groupIndex,
                                       @RequestBody Map<String, String> body) {
        matchService.updateTeamName(matchId, groupIndex, body.get("name"));
        return Result.success();
    }

    @PostMapping("/{matchId}/start")
    public Result<Void> startMatch(@PathVariable Long matchId, @RequestBody Map<String, String> body) {
        String actualStartTimeStr = body.get("actualStartTime");
        if (actualStartTimeStr == null || actualStartTimeStr.isEmpty()) {
            return Result.error(400, "实际开赛时间不能为空");
        }
        java.time.LocalDateTime actualStartTime = java.time.LocalDateTime.parse(actualStartTimeStr);
        matchService.startMatch(matchId, actualStartTime);
        return Result.success();
    }

    @PostMapping("/{matchId}/finish")
    public Result<Void> finishMatch(@PathVariable Long matchId) {
        matchService.finishMatch(matchId);
        return Result.success();
    }

    @PostMapping("/{matchId}/settlement")
    @RequiresRoles("admin")
    public Result<Void> saveAndPublishSettlement(@PathVariable Long matchId, @RequestBody com.bottomlord.dto.SettlementRequest request) {
        matchService.saveAndPublishSettlement(matchId, request);
        return Result.success();
    }

    @PostMapping("/{matchId}/payment/batch")
    @RequiresRoles("admin")
    public Result<Void> batchUpdatePaymentToPaid(@PathVariable Long matchId) {
        matchService.batchUpdatePaymentToPaid(matchId);
        return Result.success();
    }

    @GetMapping("/{id}/registrations")
    public Result<List<MatchRegistration>> listRegistrations(@PathVariable Long id) {
        return Result.success(registrationService.getBillableRegistrations(id));
    }

    @PostMapping("/{id}/payment")
    public Result<Void> updatePayment(@PathVariable Long id, @RequestParam Long playerId, @RequestParam String status) {
        registrationService.updatePaymentStatus(id, playerId, status);
        return Result.success();
    }

    @GetMapping("/{matchId}/report")
    public Result<Object> getMatchReport(@PathVariable Long matchId) {
        Match match = matchService.getMatchDetail(matchId);
        if (match == null) {
            return Result.error(404, "赛事不存在");
        }
        return Result.success(reportExporter.export(match));
    }

    @GetMapping("/{matchId}/standings")
    public Result<StandingsVO> getStandings(@PathVariable Long matchId) {
        return Result.success(matchArenaService.getStandings(matchId));
    }

    @GetMapping("/{matchId}/stats")
    public Result<MatchStatsVO> getStats(@PathVariable Long matchId) {
        return Result.success(matchArenaService.getStats(matchId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteMatch(@PathVariable Long id) {
        matchService.deleteMatch(id);
        return Result.success();
    }

    @PostMapping("/{matchId}/rollback")
    public Result<Void> rollbackStatus(@PathVariable Long matchId, @RequestParam String targetStatus) {
        matchService.rollbackMatchStatus(matchId, targetStatus);
        return Result.success();
    }

    @PutMapping("/{matchId}/actual-start-time")
    public Result<Void> updateActualStartTime(@PathVariable Long matchId, @RequestBody Map<String, String> body) {
        String actualStartTimeStr = body.get("actualStartTime");
        if (actualStartTimeStr == null || actualStartTimeStr.isEmpty()) {
            return Result.error(400, "实际开赛时间不能为空");
        }
        java.time.LocalDateTime actualStartTime = java.time.LocalDateTime.parse(actualStartTimeStr);
        matchService.updateActualStartTime(matchId, actualStartTime);
        return Result.success();
    }

    @DeleteMapping("/{matchId}/soft")
    public Result<Void> softDeleteMatch(@PathVariable Long matchId) {
        User user = (User) SecurityUtils.getSubject().getPrincipal();
        matchService.softDeleteMatch(matchId, user.getId());
        return Result.success();
    }

    @GetMapping("/trash")
    public Result<List<Match>> listTrash() {
        return Result.success(matchService.listTrashedMatches());
    }

    @DeleteMapping("/{matchId}/permanent")
    public Result<Void> permanentDelete(@PathVariable Long matchId) {
        matchService.permanentDeleteMatch(matchId);
        return Result.success();
    }

    @PostMapping("/{matchId}/restore")
    public Result<Void> restoreMatch(@PathVariable Long matchId) {
        matchService.restoreMatch(matchId);
        return Result.success();
    }

    @GetMapping("/{matchId}/eligible-players")
    public Result<List<com.bottomlord.entity.Player>> getEligiblePlayers(@PathVariable Long matchId) {
        return Result.success(matchService.getEligiblePlayers(matchId));
    }

    @PostMapping("/{matchId}/admin/add-player")
    public Result<Void> adminAddPlayer(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.adminAddPlayer(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/admin/batch-add-players")
    public Result<Void> adminBatchAddPlayers(@PathVariable Long matchId, @RequestBody List<Long> playerIds) {
        matchService.adminBatchAddPlayers(matchId, playerIds);
        return Result.success();
    }

    @PostMapping("/{matchId}/admin/cancel-player")
    public Result<Void> adminCancelPlayer(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchService.adminCancelRegistration(matchId, playerId);
        return Result.success();
    }
}
