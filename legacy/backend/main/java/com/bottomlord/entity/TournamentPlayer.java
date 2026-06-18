package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 球员-Tournament 注册关系及 Tournament 维度数据
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("tournament_player")
public class TournamentPlayer extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tournamentId;

    private Long playerId;

    private Long clubId;

    private LocalDateTime lastMatchTime;

    private LocalDateTime lastAttendanceTime;

    /**
     * 加入状态: PENDING / ACTIVE / LEFT
     */
    private String joinStatus;

    /**
     * 状态：1-活跃，0-隐退
     */
    private Integer status;

    // ---- 冗余展示字段（不持久化） ----

    @TableField(exist = false)
    private String playerNickname;

    @TableField(exist = false)
    private String playerPosition;

    @TableField(exist = false)
    private String tournamentName;

    @TableField(exist = false)
    private String clubName;
}
