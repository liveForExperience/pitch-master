package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 比分变动审计日志实体
 * 
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("match_score_log")
public class MatchScoreLog extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long gameId;

    private Integer scoreA;

    private Integer scoreB;

    /**
     * 类型：MANUAL, GOAL
     */
    private String type;
}
