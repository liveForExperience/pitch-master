package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 赛事报名关系实体
 *
 * @author Gemini
 */
@Data
@TableName("match_registration")
public class MatchRegistration implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Long playerId;

    /**
     * 分配的小组序号 (0-N)
     */
    private Integer groupIndex;

    /**
     * 状态：REGISTERED, CANCELLED, NO_SHOW
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
     * 是否为本场 MVP
     */
    private Boolean isMvp;

    private LocalDateTime createdAt;
}
