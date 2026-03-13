package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.MatchEvent;
import com.bottomlord.exporter.MatchReportExporter;
import com.bottomlord.service.MatchEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/match")
public class MatchEventController {

    @Autowired
    private MatchEventService matchEventService;

    @Autowired
    private MatchReportExporter reportExporter;

    @GetMapping("/list")
    public Result<List<MatchEvent>> listMatches() {
        return Result.success(matchEventService.listUpcomingMatches());
    }

    @GetMapping("/{id}")
    public Result<MatchEvent> getMatch(@PathVariable Long id) {
        return Result.success(matchEventService.getById(id));
    }

    @PostMapping("/publish")
    public Result<MatchEvent> publishMatch(@RequestBody MatchEvent matchEvent) {
        return Result.success(matchEventService.publishMatch(matchEvent));
    }

    @PostMapping("/{matchId}/register")
    public Result<Void> register(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchEventService.registerForMatch(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/cancel")
    public Result<Void> cancelRegistration(@PathVariable Long matchId, @RequestParam Long playerId) {
        matchEventService.cancelRegistration(matchId, playerId);
        return Result.success();
    }

    @PostMapping("/{matchId}/group")
    public Result<Map<Integer, List<Long>>> confirmAndGroup(@PathVariable Long matchId) {
        return Result.success(matchEventService.confirmAndGroup(matchId));
    }

    @PostMapping("/{matchId}/finish")
    public Result<Void> finishMatch(@PathVariable Long matchId) {
        matchEventService.finishMatch(matchId);
        return Result.success();
    }

    @GetMapping("/{matchId}/report")
    public Result<Object> getMatchReport(@PathVariable Long matchId) {
        MatchEvent match = matchEventService.getById(matchId);
        if (match == null) {
            return Result.error(404, "赛事不存在");
        }
        return Result.success(reportExporter.export(match));
    }
}
