package com.bottomlord.service;

import com.bottomlord.dto.MatchStatsVO;
import com.bottomlord.dto.StandingsVO;

/**
 * 赛事看台服务：聚合积分榜与数据榜
 */
public interface MatchArenaService {

    /**
     * 获取赛事积分榜（基于 gameFormat 分发，当前仅支持 LEAGUE）
     *
     * @param matchId 赛事 ID
     * @return 积分榜数据
     */
    StandingsVO getStandings(Long matchId);

    /**
     * 获取赛事数据榜（射手榜 + 助攻榜）
     *
     * @param matchId 赛事 ID
     * @return 射手/助攻统计
     */
    MatchStatsVO getStats(Long matchId);
}
