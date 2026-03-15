package com.bottomlord.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 消息总线 (基于 SSE)
 * 支撑赛事级比分更新、俱乐部级重要通知及个人提醒
 * 
 * @author Gemini
 */
@Slf4j
@Component
public class SseManager {

    // Key: clubId, Value: { userId -> SseEmitter }
    private final Map<Long, Map<Long, SseEmitter>> clubEmitters = new ConcurrentHashMap<>();

    // Key: matchId, Value: { userId -> SseEmitter }
    // 注意：match 级别的订阅通常也属于某个 club，但在实现比分推送时，match 粒度更高效
    private final Map<Long, Map<Long, SseEmitter>> matchEmitters = new ConcurrentHashMap<>();

    /**
     * 订阅俱乐部级别的全局通知 (用于满员、取消赛事等)
     */
    public SseEmitter subscribeClub(Long clubId, Long userId) {
        SseEmitter emitter = createEmitter(userId);
        clubEmitters.computeIfAbsent(clubId, k -> new ConcurrentHashMap<>()).put(userId, emitter);
        
        emitter.onCompletion(() -> clubEmitters.getOrDefault(clubId, Map.of()).remove(userId));
        emitter.onTimeout(() -> clubEmitters.getOrDefault(clubId, Map.of()).remove(userId));
        
        return emitter;
    }

    /**
     * 订阅特定赛事的实时比分 (用于 MatchDetail 页面)
     */
    public SseEmitter subscribeMatch(Long matchId, Long userId) {
        SseEmitter emitter = createEmitter(userId);
        matchEmitters.computeIfAbsent(matchId, k -> new ConcurrentHashMap<>()).put(userId, emitter);
        
        emitter.onCompletion(() -> matchEmitters.getOrDefault(matchId, Map.of()).remove(userId));
        emitter.onTimeout(() -> matchEmitters.getOrDefault(matchId, Map.of()).remove(userId));
        
        return emitter;
    }

    private SseEmitter createEmitter(Long userId) {
        // 设置 30 分钟超时，前端需负责断线重连
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); 
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connected for user: " + userId));
        } catch (IOException e) {
            log.error("Failed to send initial connect event", e);
        }
        return emitter;
    }

    /**
     * 全俱乐部广播通知
     */
    public void broadcastToClub(Long clubId, String eventName, Object data) {
        Map<Long, SseEmitter> emitters = clubEmitters.get(clubId);
        if (emitters != null) {
            sendToGroup(emitters, eventName, data);
        }
    }

    /**
     * 赛事级广播 (比分更新)
     */
    public void broadcastToMatch(Long matchId, Object data) {
        Map<Long, SseEmitter> emitters = matchEmitters.get(matchId);
        if (emitters != null) {
            sendToGroup(emitters, "score_update", data);
        }
    }

    private void sendToGroup(Map<Long, SseEmitter> emitters, String eventName, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                log.warn("Failed to send SSE to user {}, removing emitter", userId);
                emitter.complete();
            }
        });
    }

    /**
     * 个人定向通知
     */
    public void sendToUser(Long clubId, Long userId, String eventName, Object data) {
        Map<Long, SseEmitter> emitters = clubEmitters.get(clubId);
        if (emitters != null) {
            SseEmitter emitter = emitters.get(userId);
            if (emitter != null) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(data));
                } catch (IOException e) {
                    emitter.complete();
                }
            }
        }
    }
}
