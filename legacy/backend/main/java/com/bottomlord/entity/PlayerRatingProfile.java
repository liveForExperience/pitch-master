package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("player_rating_profile")
public class PlayerRatingProfile {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long playerId;

    private Long tournamentId;

    private BigDecimal skillRating;

    private BigDecimal performanceRating;

    private BigDecimal engagementRating;

    private Integer provisionalMatches;

    private Integer appearanceCount;

    private Integer activeStreakWeeks;

    private LocalDateTime lastAttendanceTime;

    private LocalDateTime lastDecayTime;

    private Integer ratingVersion;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
