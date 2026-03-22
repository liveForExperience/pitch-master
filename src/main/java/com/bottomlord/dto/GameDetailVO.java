package com.bottomlord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 场次详情聚合 VO
 * 包含场次信息、所属赛事上下文、参赛人员及进球明细，供前端三态页面渲染使用
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameDetailVO {

    private Long gameId;
    private Long matchId;

    private Integer teamAIndex;
    private Integer teamBIndex;

    /**
     * 队伍自定义名称 map，key=groupIndex，value=队名
     */
    private Map<Integer, String> teamNames;

    private Integer scoreA;
    private Integer scoreB;

    /**
     * 场次状态：READY / PLAYING / FINISHED
     */
    private String status;

    /**
     * 实际开始时间（PLAYING/FINISHED 有值）
     */
    private LocalDateTime startTime;

    /**
     * 预计结束时间（PLAYING 时 = startTime + durationPerGame + overtimeMinutes）
     */
    private LocalDateTime endTime;

    /**
     * 已累计加时分钟数
     */
    private Integer overtimeMinutes;

    /**
     * 场次序号（从0开始），用于前端计算预计开始时间
     */
    private Integer gameIndex;

    /**
     * 赛事开始时间，配合 gameIndex 和 durationPerGame 计算预计开始时间
     * scheduledStartTime = matchStartTime + durationPerGame * gameIndex
     */
    private LocalDateTime matchStartTime;

    /**
     * 单场预计时长（分钟）
     */
    private Integer durationPerGame;

    /**
     * A 队参赛球员列表
     */
    private List<ParticipantInfo> teamAParticipants;

    /**
     * B 队参赛球员列表
     */
    private List<ParticipantInfo> teamBParticipants;

    /**
     * 进球明细列表（按发生时间升序）
     */
    private List<GoalInfo> goals;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ParticipantInfo {
        private Long participantId;
        private Long playerId;
        private String playerName;
        private String position;
        private Integer goals;
        private Integer assists;
        private Boolean isMvp;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GoalInfo {
        private Long goalId;
        private Integer teamIndex;
        private Long scorerId;
        private String scorerName;
        private Long assistantId;
        private String assistantName;
        private String type;
        private LocalDateTime occurredAt;
    }
}
