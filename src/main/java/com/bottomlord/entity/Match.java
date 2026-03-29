package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 比赛/周赛 (L4)
 * 原名 Match，现重构为 Match 以符合领域模型建议。
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "`match`", autoResultMap = true)
public class Match extends BaseEntity {

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

    /**
     * 实际开赛时间（管理员触发开赛时设置，允许调整）
     */
    private LocalDateTime actualStartTime;

    /**
     * 比赛结束时间
     */
    private LocalDateTime endTime;

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
    public static final String STATUS_REGISTRATION_CLOSED = "REGISTRATION_CLOSED";
    public static final String STATUS_ONGOING = "ONGOING";
    public static final String STATUS_MATCH_FINISHED = "MATCH_FINISHED";
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

    /**
     * 每场游戏时长（单位：分钟）
     */
    private Integer durationPerGame;

    private BigDecimal totalCost;

    private BigDecimal perPersonCost;

    /**
     * 状态：PREPARING, PUBLISHED, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, CANCELLED
     */
    private String status;

    /**
     * 分组是否已发布：false=草稿（仅管理员可见），true=已发布（所有人可见）
     */
    private Boolean groupsPublished;

    /**
     * 各队自定义名称，key 为组号（0-N），value 为队伍名称
     */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<Integer, String> teamNames;

    /**
     * 结算信息是否已确认发布
     */
    private Boolean settlementPublished;

    /**
     * 赛制类型：LEAGUE=联赛积分制（默认），预留扩展点
     */
    private String gameFormat;

    /**
     * 软删除时间
     */
    private LocalDateTime deletedAt;

    /**
     * 删除操作人用户ID
     */
    private Long deletedBy;

    public static final String GAME_FORMAT_LEAGUE = "LEAGUE";
}
