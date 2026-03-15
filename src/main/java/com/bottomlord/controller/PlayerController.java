package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.Player;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping("/{id}")
    public Result<Player> getPlayer(@PathVariable Long id) {
        return Result.success(playerService.getById(id));
    }

    /**
     * 管理员手动修正球员评分
     */
    @PostMapping("/{id}/rating")
    public Result<Void> updateRating(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal newRating = new BigDecimal(body.get("newRating").toString());
        String reason = body.getOrDefault("reason", "管理员手动修正").toString();
        
        playerService.updateRatingManually(id, newRating, reason);
        return Result.success(null);
    }
}
