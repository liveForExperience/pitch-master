package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.service.GameParticipantService;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game-participant")
public class GameParticipantController {

    @Autowired
    private GameParticipantService participantService;

    @GetMapping("/list/{gameId}")
    public Result<List<GameParticipant>> listByGame(@PathVariable Long gameId) {
        return Result.success(participantService.listByGameId(gameId));
    }

    @PostMapping("/batch-update")
    @RequiresRoles("admin")
    public Result<Void> batchUpdate(@RequestBody List<GameParticipant> participants) {
        participantService.batchUpdateStats(participants);
        return Result.success();
    }
}
