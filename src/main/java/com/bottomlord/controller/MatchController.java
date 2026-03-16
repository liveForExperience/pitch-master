package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.exporter.MatchReportExporter;
import com.bottomlord.service.MatchService;
import com.bottomlord.service.MatchRegistrationService;
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

    @PostMapping("/{matchId}/group")
    public Result<Map<Integer, List<Long>>> confirmAndGroup(@PathVariable Long matchId) {
        return Result.success(matchService.confirmAndGroup(matchId));
    }

    @PostMapping("/{matchId}/start-with-groups")
    public Result<Void> startWithGroups(@PathVariable Long matchId, @RequestBody Map<Integer, List<Long>> finalGroups) {
        matchService.startWithGroups(matchId, finalGroups);
        return Result.success();
    }

    @PostMapping("/{matchId}/finish")
    public Result<Void> finishMatch(@PathVariable Long matchId) {
        matchService.finishMatch(matchId);
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

    @DeleteMapping("/{id}")
    public Result<Void> deleteMatch(@PathVariable Long id) {
        matchService.deleteMatch(id);
        return Result.success();
    }
}
