package com.bottomlord.common.util;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 简单实时推送管理器 (基于 SSE)
 * 
 * @author Gemini
 */
@Component
public class SseManager {

    // Key: matchId, Value: 该赛事的监听者们
    private final Map<Long, Map<String, SseEmitter>> matchEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long matchId, String userId) {
        SseEmitter emitter = new SseEmitter(0L); // 永不超时，实际生产应设置合理值
        
        matchEmitters.computeIfAbsent(matchId, k -> new ConcurrentHashMap<>()).put(userId, emitter);
        
        emitter.onCompletion(() -> removeEmitter(matchId, userId));
        emitter.onTimeout(() -> removeEmitter(matchId, userId));
        
        return emitter;
    }

    public void broadcast(Long matchId, Object data) {
        Map<String, SseEmitter> emitters = matchEmitters.get(matchId);
        if (emitters != null) {
            emitters.forEach((userId, emitter) -> {
                try {
                    emitter.send(data);
                } catch (IOException e) {
                    removeEmitter(matchId, userId);
                }
            });
        }
    }

    private void removeEmitter(Long matchId, String userId) {
        Map<String, SseEmitter> emitters = matchEmitters.get(matchId);
        if (emitters != null) {
            emitters.remove(userId);
        }
    }
}
