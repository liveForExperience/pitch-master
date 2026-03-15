package com.bottomlord.common.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * 比赛结算领域事件
 * 触发点：管理员确认结算 (MatchServiceImpl.settleFees)
 * 监听者：RatingService (更新评分), SseManager (发送通知)
 */
@Getter
public class MatchSettledEvent extends ApplicationEvent {
    private final Long matchId;
    private final Long tournamentId;

    public MatchSettledEvent(Object source, Long matchId, Long tournamentId) {
        super(source);
        this.matchId = matchId;
        this.tournamentId = tournamentId;
    }
}
