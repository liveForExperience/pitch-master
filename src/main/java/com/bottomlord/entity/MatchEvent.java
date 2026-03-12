package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 赛事活动实体
 *
 * @author Gemini
 */
@Data
@TableName("match_event")
public class MatchEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private LocalDateTime startTime;

    private LocalDateTime cancelDeadline;

    private String location;

    /**
     * 需要分配的小组数量
     */
    private Integer numGroups;

    /**
     * 每支队伍的人数（用于开赛条件检查）
     */
    private Integer playersPerGroup;

    private BigDecimal totalCost;

    private BigDecimal perPersonCost;

    /**
     * 状态：SCHEDULED, ONGOING, FINISHED, CANCELLED
     */
    private String status;

    private LocalDateTime createdAt;
}
