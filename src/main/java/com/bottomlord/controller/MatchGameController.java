package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.service.MatchGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
public class MatchGameController {

    @Autowired
    private MatchGameService matchGameService;

    @PostMapping("/{gameId}/start")
    public Result<MatchGame> startGame(@PathVariable Long gameId, @RequestParam int durationMinutes) {
        return Result.success(matchGameService.startGame(gameId, durationMinutes));
    }

    @PostMapping("/{gameId}/overtime")
    public Result<MatchGame> addOvertime(@PathVariable Long gameId, @RequestParam int extraMinutes) {
        return Result.success(matchGameService.addOvertime(gameId, extraMinutes));
    }

    @PostMapping("/goal")
    public Result<Void> recordGoal(@RequestBody MatchGoal goal) {
        matchGameService.recordGoal(goal);
        return Result.success();
    }

    @PostMapping("/{gameId}/score")
    public Result<Void> updateScoreManually(@PathVariable Long gameId, @RequestParam int scoreA, @RequestParam int scoreB) {
        matchGameService.updateScoreManually(gameId, scoreA, scoreB);
        return Result.success();
    }

    @PostMapping("/{gameId}/finish")
    public Result<Void> finishGame(@PathVariable Long gameId) {
        matchGameService.finishGame(gameId);
        return Result.success();
    }
}
