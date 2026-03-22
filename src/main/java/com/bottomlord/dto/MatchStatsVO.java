package com.bottomlord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 赛事数据榜 VO（射手榜 + 助攻榜）
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchStatsVO {

    /**
     * 射手榜（按进球数降序，最多10条）
     */
    private List<PlayerStats> topScorers;

    /**
     * 助攻榜（按助攻数降序，最多10条）
     */
    private List<PlayerStats> topAssisters;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlayerStats {
        private Long playerId;
        private String playerName;
        private int goals;
        private int assists;
    }
}
