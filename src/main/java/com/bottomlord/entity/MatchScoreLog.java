package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 比分变动审计日志实体
 * 
 * @author Gemini
 */
@Data
@TableName("match_score_log")
public class MatchScoreLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long gameId;

    private Integer scoreA;

    private Integer scoreB;

    private Long operatorId;

    /**
     * 类型：MANUAL, GOAL
     */
    private String type;

    private LocalDateTime createdAt;
}
