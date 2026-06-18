package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

/**
 * 比赛场次实体
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("match_game")
public class MatchGame extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Integer teamAIndex;

    private Integer teamBIndex;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer overtimeMinutes;

    private Integer scoreA;

    private Integer scoreB;

    /**
     * 场次在赛事中的顺序序号（从0开始），用于计算预计开始时间
     * scheduledStartTime = match.startTime + match.durationPerGame * gameIndex
     */
    private Integer gameIndex;

    /**
     * 状态：READY, PLAYING, FINISHED
     */
    private String status;

    /**
     * 当前锁定此场次的用户ID
     */
    private Long lockUserId;

    /**
     * 锁定开始时间
     */
    private LocalDateTime lockTime;
}
