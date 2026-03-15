package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 比赛/周赛 (L4)
 * 原名 Match，现重构为 Match 以符合领域模型建议。
 *
 * @author Gemini
 */
@Data
@TableName("match_event")
public class Match implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属赛事租户ID
     */
    private Long tournamentId;

    /**
     * 冗余字段：所属赛事名称 (仅用于前端展示，不持久化)
     */
    @TableField(exist = false)
    private String tournamentName;

    private String title;

    private LocalDateTime startTime;

    private LocalDateTime registrationDeadline;

    private LocalDateTime cancelDeadline;

    private String location;

    /**
     * 报名主体类型: PLAYER (散拼), CLUB (整队)
     */
    private String registrationType;

    /**
     * 状态常量
     */
    public static final String STATUS_PREPARING = "PREPARING";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_GROUPING_DRAFT = "GROUPING_DRAFT";
    public static final String STATUS_REGISTRATION_CLOSED = "REGISTRATION_CLOSED";
    public static final String STATUS_ONGOING = "ONGOING";
    public static final String STATUS_MATCH_FINISHED = "MATCH_FINISHED";
    public static final String STATUS_SETTLED = "SETTLED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    /**
     * 需要分配的小组数量
     */
    private Integer numGroups;

    /**
     * 每支队伍的人数（用于开赛条件检查）
     */
    private Integer playersPerGroup;

    /**
     * 计划进行的总场次
     */
    private Integer plannedGameCount;

    private BigDecimal totalCost;

    private BigDecimal perPersonCost;

    /**
     * 状态：PREPARING, PUBLISHED, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, SETTLED, CANCELLED
     */
    private String status;

    private LocalDateTime createdAt;
}
