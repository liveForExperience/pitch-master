package com.bottomlord.controller;

import com.bottomlord.common.base.Result;
import com.bottomlord.entity.Player;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping("/{id}")
    public Result<Player> getPlayer(@PathVariable Long id) {
        return Result.success(playerService.getById(id));
    }
}
