package com.bottomlord.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 球员评分展示DTO
 */
@Data
public class PlayerRatingDTO {
    private Long playerId;
    private String playerName;
    private BigDecimal totalRating;
    private BigDecimal skillRating;
    private BigDecimal performanceRating;
    private BigDecimal engagementRating;
    private Integer provisionalMatches;
    private Integer appearanceCount;
    private Integer activeStreakWeeks;
    private LocalDateTime lastAttendanceTime;
    private LocalDateTime lastDecayTime;
    private Integer ratingVersion;
}
