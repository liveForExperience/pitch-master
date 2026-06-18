package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 评分 CPI 变动审计记录
 */
@Data
@TableName("player_rating_history")
public class PlayerRatingHistory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long playerId;

    private Long tournamentId;

    private Long matchId;

    private String dimension;

    private String sourceType;

    private BigDecimal oldRating;

    private BigDecimal newRating;

    private BigDecimal oldValue;

    private BigDecimal newValue;

    private BigDecimal delta;

    private String changeReason;

    private String reasonCode;

    private String reasonDetail;

    private Long operatorUserId;

    private LocalDateTime createTime;
}