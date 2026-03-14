package com.bottomlord.controller;

import com.bottomlord.common.util.SseManager;
import com.bottomlord.entity.User;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/realtime")
public class RealTimeController {

    @Autowired
    private SseManager sseManager;

    @GetMapping("/subscribe/{matchId}")
    public SseEmitter subscribe(@PathVariable Long matchId) {
        User user = (User) SecurityUtils.getSubject().getPrincipal();
        String userId = user != null ? user.getId().toString() : "anonymous-" + System.currentTimeMillis();
        return sseManager.subscribe(matchId, userId);
    }
}
