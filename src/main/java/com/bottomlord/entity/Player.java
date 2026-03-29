package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 球员档案实体
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("player")
public class Player extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属赛事租户ID
     */
    private Long tournamentId;

    /**
     * 所属俱乐部ID
     */
    @TableField("real_club_id")
    private Long clubId;

    /**
     * 冗余字段：所属俱乐部名称 (仅用于前端展示，不持久化)
     */
    @TableField(exist = false)
    private String clubName;

    /**
     * 冗余字段：所属赛事名称 (仅用于前端展示，不持久化)
     */
    @TableField(exist = false)
    private String tournamentName;

    private Long userId;

    /**
     * 球场昵称
     */
    private String nickname;

    /**
     * 擅长位置：GK, DF, MF, FW
     */
    private String position;

    /**
     * 综合技术评分 (1.0-10.0)
     */
    private BigDecimal rating;

    private Integer ratingVersion;

    private Integer age;

    /**
     * 擅长脚：LEFT, RIGHT, BOTH
     */
    private String preferredFoot;

    /**
     * 性别: MALE / FEMALE
     */
    private String gender;

    /**
     * 身高(cm)
     */
    private Integer height;

    /**
     * 状态：1-活跃，0-隐退
     */
    private Integer status;

    /**
     * 最后一次参加比赛的时间 (用于计算评分衰减)
     */
    private LocalDateTime lastMatchTime;

    private LocalDateTime lastAttendanceTime;
}
