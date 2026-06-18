package com.bottomlord.service.impl;

import com.bottomlord.dto.MatchStatsVO;
import com.bottomlord.dto.StandingsVO;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.entity.Player;
import com.bottomlord.service.MatchArenaService;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchGoalService;
import com.bottomlord.service.MatchService;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 赛事看台服务实现
 */
@Service
public class MatchArenaServiceImpl implements MatchArenaService {

    @Autowired
    private MatchService matchService;

    @Autowired
    private MatchGameService matchGameService;

    @Autowired
    private MatchGoalService matchGoalService;

    @Autowired
    private PlayerService playerService;

    @Override
    public StandingsVO getStandings(Long matchId) {
        Match match = matchService.getMatchDetail(matchId);
        if (match == null) return null;

        List<MatchGame> finishedGames = matchGameService.listByMatchId(matchId).stream()
                .filter(g -> "FINISHED".equals(g.getStatus()))
                .collect(Collectors.toList());

        Map<Integer, String> teamNames = match.getTeamNames() != null ? match.getTeamNames() : new HashMap<>();
        int numGroups = match.getNumGroups() != null ? match.getNumGroups() : 0;

        Map<Integer, RawStats> statsMap = new LinkedHashMap<>();
        for (int i = 0; i < numGroups; i++) {
            statsMap.put(i, new RawStats(i));
        }

        for (MatchGame game : finishedGames) {
            int idxA = game.getTeamAIndex();
            int idxB = game.getTeamBIndex();
            int scoreA = game.getScoreA() == null ? 0 : game.getScoreA();
            int scoreB = game.getScoreB() == null ? 0 : game.getScoreB();

            RawStats sA = statsMap.computeIfAbsent(idxA, RawStats::new);
            RawStats sB = statsMap.computeIfAbsent(idxB, RawStats::new);

            sA.played++;
            sB.played++;
            sA.goalsFor += scoreA;
            sA.goalsAgainst += scoreB;
            sB.goalsFor += scoreB;
            sB.goalsAgainst += scoreA;

            if (scoreA > scoreB) {
                sA.wins++;
                sA.points += 3;
                sB.losses++;
            } else if (scoreA == scoreB) {
                sA.draws++;
                sA.points += 1;
                sB.draws++;
                sB.points += 1;
            } else {
                sB.wins++;
                sB.points += 3;
                sA.losses++;
            }
        }

        List<RawStats> sorted = new ArrayList<>(statsMap.values());
        final List<MatchGame> games = finishedGames;
        sorted.sort((a, b) -> {
            if (b.points != a.points) return b.points - a.points;
            int hhA = headToHeadPoints(a.teamIndex, b.teamIndex, games);
            int hhB = headToHeadPoints(b.teamIndex, a.teamIndex, games);
            if (hhA != hhB) return hhB - hhA;
            int gdA = a.goalsFor - a.goalsAgainst;
            int gdB = b.goalsFor - b.goalsAgainst;
            if (gdA != gdB) return gdB - gdA;
            return b.goalsFor - a.goalsFor;
        });

        List<StandingsVO.TeamStanding> standings = new ArrayList<>();
        int rank = 1;
        for (int i = 0; i < sorted.size(); i++) {
            if (i > 0 && compareStats(sorted.get(i), sorted.get(i - 1), games) != 0) {
                rank = i + 1;
            }
            RawStats s = sorted.get(i);
            StandingsVO.TeamStanding ts = new StandingsVO.TeamStanding();
            ts.setTeamIndex(s.teamIndex);
            ts.setTeamName(teamNames.getOrDefault(s.teamIndex, "队伍 " + (char) ('A' + s.teamIndex)));
            ts.setRank(rank);
            ts.setPlayed(s.played);
            ts.setWins(s.wins);
            ts.setDraws(s.draws);
            ts.setLosses(s.losses);
            ts.setGoalsFor(s.goalsFor);
            ts.setGoalsAgainst(s.goalsAgainst);
            ts.setGoalDifference(s.goalsFor - s.goalsAgainst);
            ts.setPoints(s.points);
            standings.add(ts);
        }

        StandingsVO vo = new StandingsVO();
        vo.setGameFormat(match.getGameFormat() != null ? match.getGameFormat() : Match.GAME_FORMAT_LEAGUE);
        vo.setStandings(standings);
        return vo;
    }

    @Override
    public MatchStatsVO getStats(Long matchId) {
        List<MatchGame> games = matchGameService.listByMatchId(matchId);
        if (games.isEmpty()) {
            return new MatchStatsVO(Collections.emptyList(), Collections.emptyList());
        }

        Map<Long, int[]> aggregated = new HashMap<>();
        for (MatchGame game : games) {
            List<MatchGoal> goals = matchGoalService.listByGameId(game.getId());
            for (MatchGoal goal : goals) {
                if (goal.getScorerId() != null && !"OWN_GOAL".equals(goal.getType())) {
                    int[] arr = aggregated.computeIfAbsent(goal.getScorerId(), k -> new int[]{0, 0});
                    arr[0] += 1;
                }
                if (goal.getAssistantId() != null) {
                    int[] arr = aggregated.computeIfAbsent(goal.getAssistantId(), k -> new int[]{0, 0});
                    arr[1] += 1;
                }
            }
        }

        Map<Long, String> nameCache = new HashMap<>();
        for (Long pid : aggregated.keySet()) {
            Player player = playerService.getById(pid);
            nameCache.put(pid, player != null ? player.getNickname() : "球员#" + pid);
        }

        List<MatchStatsVO.PlayerStats> scorers = aggregated.entrySet().stream()
                .filter(e -> e.getValue()[0] > 0)
                .map(e -> new MatchStatsVO.PlayerStats(e.getKey(), nameCache.get(e.getKey()), e.getValue()[0], e.getValue()[1]))
                .sorted(Comparator.comparingInt(MatchStatsVO.PlayerStats::getGoals).reversed())
                .limit(10)
                .collect(Collectors.toList());

        List<MatchStatsVO.PlayerStats> assisters = aggregated.entrySet().stream()
                .filter(e -> e.getValue()[1] > 0)
                .map(e -> new MatchStatsVO.PlayerStats(e.getKey(), nameCache.get(e.getKey()), e.getValue()[0], e.getValue()[1]))
                .sorted(Comparator.comparingInt(MatchStatsVO.PlayerStats::getAssists).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return new MatchStatsVO(scorers, assisters);
    }

    private int headToHeadPoints(int teamIndex, int opponentIndex, List<MatchGame> games) {
        int points = 0;
        for (MatchGame game : games) {
            int sA = game.getScoreA() == null ? 0 : game.getScoreA();
            int sB = game.getScoreB() == null ? 0 : game.getScoreB();
            if (game.getTeamAIndex() == teamIndex && game.getTeamBIndex() == opponentIndex) {
                if (sA > sB) points += 3;
                else if (sA == sB) points += 1;
            } else if (game.getTeamBIndex() == teamIndex && game.getTeamAIndex() == opponentIndex) {
                if (sB > sA) points += 3;
                else if (sA == sB) points += 1;
            }
        }
        return points;
    }

    private int compareStats(RawStats a, RawStats b, List<MatchGame> games) {
        if (b.points != a.points) return b.points - a.points;
        int hhA = headToHeadPoints(a.teamIndex, b.teamIndex, games);
        int hhB = headToHeadPoints(b.teamIndex, a.teamIndex, games);
        if (hhA != hhB) return hhB - hhA;
        int gdA = a.goalsFor - a.goalsAgainst;
        int gdB = b.goalsFor - b.goalsAgainst;
        if (gdA != gdB) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
    }

    private static class RawStats {
        int teamIndex;
        int played, wins, draws, losses, goalsFor, goalsAgainst, points;

        RawStats(int teamIndex) {
            this.teamIndex = teamIndex;
        }
    }
}
