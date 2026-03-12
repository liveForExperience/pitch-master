package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 进球记录实体
 *
 * @author Gemini
 */
@Data
@TableName("match_goal")
public class MatchGoal implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long gameId;

    /**
     * 进球方球队序号 (0-N)
     */
    private Integer teamIndex;

    /**
     * 进球球员ID (NULL表示未知/占位)
     */
    private Long scorerId;

    /**
     * 助攻球员ID
     */
    private Long assistantId;

    /**
     * 类型：NORMAL-普通, OWN_GOAL-乌龙
     */
    private String type;

    /**
     * 进球发生时间
     */
    private LocalDateTime occurredAt;
}
