package com.bottomlord.dto;

import lombok.Data;

import java.util.List;

/**
 * 积分榜 VO
 */
@Data
public class StandingsVO {

    /**
     * 赛制类型（当前支持 LEAGUE）
     */
    private String gameFormat;

    /**
     * 按排名排序的队伍积分列表
     */
    private List<TeamStanding> standings;

    @Data
    public static class TeamStanding {

        /**
         * 队伍序号（对应 match_game 中的 teamAIndex / teamBIndex）
         */
        private Integer teamIndex;

        /**
         * 队伍名称（来自 match.teamNames，未配置时为默认名）
         */
        private String teamName;

        /**
         * 当前排名（并列时相同）
         */
        private Integer rank;

        private int played;
        private int wins;
        private int draws;
        private int losses;
        private int goalsFor;
        private int goalsAgainst;
        private int goalDifference;
        private int points;
    }
}
