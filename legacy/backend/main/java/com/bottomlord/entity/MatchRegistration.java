package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 赛事报名关系实体
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("match_registration")
public class MatchRegistration extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Long playerId;

    /**
     * 分配的小组序号 (0-N)
     */
    private Integer groupIndex;

    /**
     * 状态：
     * REGISTERED - 已报名（在容量内或管理员已批准）
     * PENDING - 待审批（超出容量，等待管理员批准）
     * CANCELLED - 已取消（在反悔时间前主动取消，免费）
     * NO_SHOW - 过期取消（在反悔时间后取消，仍需付费）
     */
    private String status;

    /**
     * 豁免标记：由管理员设置，标记该球员不参与本次费用分摊
     */
    private Boolean isExempt;

    /**
     * 支付状态：UNPAID, PAID
     */
    private String paymentStatus;

    /**
     * 实际需支付金额
     */
    private java.math.BigDecimal paymentAmount;

    /**
     * 是否为本场 MVP
     */
    private Boolean isMvp;
}
