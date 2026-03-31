package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.dto.GameDetailVO;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.service.MatchGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game")
public class MatchGameController {

    @Autowired
    private MatchGameService matchGameService;

    @GetMapping("/list")
    public Result<List<MatchGame>> listGames(@RequestParam Long matchId) {
        return Result.success(matchGameService.listByMatchId(matchId));
    }

    @GetMapping("/{gameId}")
    public Result<GameDetailVO> getGameDetail(@PathVariable Long gameId) {
        return Result.success(matchGameService.getGameDetail(gameId));
    }

    @PostMapping("/{gameId}/start")
    public Result<MatchGame> startGame(@PathVariable Long gameId, @RequestBody(required = false) java.util.Map<String, String> body) {
        java.time.LocalDateTime actualStartTime = null;
        if (body != null && body.containsKey("actualStartTime") && body.get("actualStartTime") != null && !body.get("actualStartTime").isEmpty()) {
            actualStartTime = java.time.LocalDateTime.parse(body.get("actualStartTime"));
        }
        return Result.success(matchGameService.startGame(gameId, actualStartTime));
    }

    @PostMapping("/{gameId}/overtime")
    public Result<MatchGame> addOvertime(@PathVariable Long gameId, @RequestParam int extraMinutes) {
        return Result.success(matchGameService.addOvertime(gameId, extraMinutes));
    }

    @PostMapping("/{gameId}/lock")
    public Result<Boolean> tryLock(@PathVariable Long gameId) {
        boolean locked = matchGameService.tryLockGame(gameId);
        if (locked) {
            return Result.success(true);
        } else {
            return Result.error(409, "该场次正在被他人编辑");
        }
    }

    @PostMapping("/{gameId}/unlock")
    public Result<Void> unlock(@PathVariable Long gameId) {
        matchGameService.unlockGame(gameId);
        return Result.success();
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
    public Result<Void> finishGame(@PathVariable Long gameId, @RequestBody(required = false) java.util.Map<String, String> body) {
        java.time.LocalDateTime actualEndTime = null;
        if (body != null && body.containsKey("actualEndTime") && body.get("actualEndTime") != null && !body.get("actualEndTime").isEmpty()) {
            actualEndTime = java.time.LocalDateTime.parse(body.get("actualEndTime"));
        }
        matchGameService.finishGame(gameId, actualEndTime);
        return Result.success();
    }

    @GetMapping("/{gameId}/logs")
    public Result<List<com.bottomlord.entity.MatchScoreLog>> getScoreLogs(@PathVariable Long gameId) {
        return Result.success(matchGameService.getScoreLogs(gameId));
    }

    @GetMapping("/{gameId}/participants")
    public Result<List<GameParticipant>> listParticipants(@PathVariable Long gameId) {
        return Result.success(matchGameService.listParticipants(gameId));
    }

    @PostMapping("/{gameId}/participants/{playerId}")
    public Result<Void> addParticipant(@PathVariable Long gameId, @PathVariable Long playerId) {
        matchGameService.addParticipant(gameId, playerId);
        return Result.success();
    }

    @DeleteMapping("/{gameId}/participants/{playerId}")
    public Result<Void> removeParticipant(@PathVariable Long gameId, @PathVariable Long playerId) {
        matchGameService.removeParticipant(gameId, playerId);
        return Result.success();
    }

    @DeleteMapping("/goal/{goalId}")
    public Result<Void> deleteGoal(@PathVariable Long goalId) {
        matchGameService.deleteGoal(goalId);
        return Result.success();
    }

    @PatchMapping("/{gameId}/times")
    public Result<Void> updateGameTimes(@PathVariable Long gameId, @RequestBody java.util.Map<String, String> body) {
        java.time.LocalDateTime startTime = null;
        java.time.LocalDateTime endTime = null;
        if (body != null) {
            if (body.containsKey("startTime") && body.get("startTime") != null && !body.get("startTime").isEmpty()) {
                startTime = java.time.LocalDateTime.parse(body.get("startTime"));
            }
            if (body.containsKey("endTime") && body.get("endTime") != null && !body.get("endTime").isEmpty()) {
                endTime = java.time.LocalDateTime.parse(body.get("endTime"));
            }
        }
        matchGameService.updateGameTimes(gameId, startTime, endTime);
        return Result.success();
    }

    @DeleteMapping("/{gameId}")
    public Result<Void> deleteGame(@PathVariable Long gameId) {
        matchGameService.deleteGame(gameId);
        return Result.success();
    }

    @PostMapping
    public Result<MatchGame> createGame(@RequestBody java.util.Map<String, Object> body) {
        Long matchId = Long.valueOf(body.get("matchId").toString());
        Integer teamAIndex = Integer.valueOf(body.get("teamAIndex").toString());
        Integer teamBIndex = Integer.valueOf(body.get("teamBIndex").toString());
        return Result.success(matchGameService.createGame(matchId, teamAIndex, teamBIndex));
    }
}
