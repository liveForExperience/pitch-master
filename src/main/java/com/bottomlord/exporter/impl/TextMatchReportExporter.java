package com.bottomlord.exporter.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import com.bottomlord.entity.MatchEvent;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.entity.Player;
import com.bottomlord.exporter.MatchReportExporter;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchGoalService;
import com.bottomlord.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 纯文本赛事报表导出实现
 *
 * @author Gemini
 */
@Component
public class TextMatchReportExporter implements MatchReportExporter {

    @Autowired
    private MatchGameService gameService;

    @Autowired
    private MatchGoalService goalService;

    @Autowired
    private PlayerService playerService;

    @Override
    public Object export(MatchEvent matchEvent) {
        StringBuilder sb = new StringBuilder();
        sb.append("==============================\n");
        sb.append("      赛事战报: ").append(matchEvent.getTitle()).append("\n");
        sb.append("==============================\n");
        sb.append("日期: ").append(DateUtil.format(matchEvent.getStartTime(), "yyyy-MM-dd HH:mm")).append("\n");
        sb.append("地点: ").append(matchEvent.getLocation()).append("\n");
        sb.append("费用: ").append(matchEvent.getPerPersonCost()).append(" 元/人\n");
        sb.append("------------------------------\n");

        List<MatchGame> games = gameService.listByMatchId(matchEvent.getId());
        if (CollUtil.isEmpty(games)) {
            sb.append("暂无比赛记录。\n");
        } else {
            for (MatchGame game : games) {
                sb.append("场次: 队").append(game.getTeamAIndex() + 1)
                  .append(" ").append(game.getScoreA()).append(" : ")
                  .append(game.getScoreB()).append(" 队").append(game.getTeamBIndex() + 1)
                  .append("\n");

                List<MatchGoal> goals = goalService.listByGameId(game.getId());
                for (MatchGoal goal : goals) {
                    sb.append("  - 进球: ").append(getPlayerName(goal.getScorerId()));
                    if (goal.getAssistantId() != null) {
                        sb.append(" (助攻: ").append(getPlayerName(goal.getAssistantId())).append(")");
                    }
                    if ("OWN_GOAL".equals(goal.getType())) {
                        sb.append(" [乌龙球]");
                    }
                    sb.append("\n");
                }
            }
        }

        sb.append("------------------------------\n");
        sb.append("射手榜与助攻榜:\n");
        generateStats(matchEvent.getId(), sb);
        sb.append("==============================\n");

        return sb.toString();
    }

    private String getPlayerName(Long playerId) {
        if (playerId == null) {
            return "未知";
        }
        Player player = playerService.getById(playerId);
        return player != null ? player.getNickname() : "未知";
    }

    private void generateStats(Long matchId, StringBuilder sb) {
        List<MatchGame> games = gameService.listByMatchId(matchId);
        Map<Long, Integer> scorers = new HashMap<>();
        Map<Long, Integer> assistants = new HashMap<>();

        for (MatchGame game : games) {
            List<MatchGoal> goals = goalService.listByGameId(game.getId());
            for (MatchGoal goal : goals) {
                if (goal.getScorerId() != null && !"OWN_GOAL".equals(goal.getType())) {
                    scorers.merge(goal.getScorerId(), 1, Integer::sum);
                }
                if (goal.getAssistantId() != null) {
                    assistants.merge(goal.getAssistantId(), 1, Integer::sum);
                }
            }
        }

        sb.append("射手榜: ").append(formatStats(scorers)).append("\n");
        sb.append("助攻榜: ").append(formatStats(assistants)).append("\n");
    }

    private String formatStats(Map<Long, Integer> stats) {
        if (stats.isEmpty()) {
            return "无数据";
        }
        return stats.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .map(e -> getPlayerName(e.getKey()) + "(" + e.getValue() + ")")
                .collect(Collectors.joining(", "));
    }

    @Override
    public String getExportType() {
        return "TEXT";
    }
}
