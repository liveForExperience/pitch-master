package com.bottomlord.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.MatchEvent;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.mapper.MatchEventMapper;
import com.bottomlord.service.MatchEventService;
import com.bottomlord.service.MatchGameService;
import com.bottomlord.service.MatchRegistrationService;
import com.bottomlord.strategy.GroupingStrategy;
import com.bottomlord.strategy.GroupingStrategyFactory;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 赛事服务实现类
 *
 * @author Gemini
 */
@Service
public class MatchEventServiceImpl extends ServiceImpl<MatchEventMapper, MatchEvent> implements MatchEventService {

    @Autowired
    private MatchRegistrationService registrationService;

    @Autowired
    private MatchGameService gameService;

    @Autowired
    private GroupingStrategyFactory strategyFactory;

    @Override
    @RequiresRoles("ADMIN")
    @Transactional(rollbackFor = Exception.class)
    public MatchEvent publishMatch(MatchEvent match) {
        match.setStatus("SCHEDULED");
        if (match.getCancelDeadline() == null && match.getStartTime() != null) {
            // 默认最晚取消时间为开赛前 2 小时
            match.setCancelDeadline(match.getStartTime().minusHours(2));
        }
        this.save(match);
        return match;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void registerForMatch(Long matchId, Long playerId) {
        // 检查是否已报名
        long count = registrationService.count(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .ne(MatchRegistration::getStatus, "CANCELLED"));
        
        if (count > 0) {
            throw new IllegalStateException("已报名该赛事，请勿重复操作");
        }

        MatchRegistration reg = new MatchRegistration();
        reg.setMatchId(matchId);
        reg.setPlayerId(playerId);
        reg.setStatus("REGISTERED");
        registrationService.save(reg);
    }

    /**
     * 取消报名 (包含反悔逻辑)
     */
    @Transactional(rollbackFor = Exception.class)
    public void cancelRegistration(Long matchId, Long playerId) {
        MatchEvent match = this.getById(matchId);
        MatchRegistration reg = registrationService.getOne(new LambdaQueryWrapper<MatchRegistration>()
                .eq(MatchRegistration::getMatchId, matchId)
                .eq(MatchRegistration::getPlayerId, playerId)
                .eq(MatchRegistration::getStatus, "REGISTERED"));

        if (reg == null) return;

        // 检查是否超过截止时间
        if (LocalDateTime.now().isAfter(match.getCancelDeadline())) {
            // 超过期限，设为缺席但需付费 (NO_SHOW)
            reg.setStatus("NO_SHOW");
        } else {
            // 期限内，正常取消
            reg.setStatus("CANCELLED");
        }
        registrationService.updateById(reg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<Integer, List<Long>> confirmAndGroup(Long matchId) {
        MatchEvent match = this.getById(matchId);
        List<MatchRegistration> validRegs = registrationService.getValidRegistrations(matchId);
        
        int requiredPlayers = match.getNumGroups() * match.getPlayersPerGroup();
        if (validRegs.size() < requiredPlayers) {
            // 此处由于是内部调用，如果是强制启动，则跳过检查（外部可通过权限控制）
            // 在 Controller 层可以根据是否是 ADMIN 来决定是否传 force 参数
        }

        List<Long> playerIds = validRegs.stream().map(MatchRegistration::getPlayerId).collect(Collectors.toList());
        
        // 执行分组算法
        GroupingStrategy strategy = strategyFactory.getDefaultStrategy();
        Map<Integer, List<Long>> allocation = strategy.allocate(playerIds, match.getNumGroups(), new HashMap<>());

        // 更新报名表中的组号
        for (Map.Entry<Integer, List<Long>> entry : allocation.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Long playerId : entry.getValue()) {
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }

        // 自动生成循环赛场次 (Round Robin)
        generateRoundRobinGames(match);

        match.setStatus("ONGOING");
        this.updateById(match);
        
        return allocation;
    }

    private void generateRoundRobinGames(MatchEvent match) {
        int n = match.getNumGroups();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                MatchGame game = new MatchGame();
                game.setMatchId(match.getId());
                game.setTeamAIndex(i);
                game.setTeamBIndex(j);
                game.setStatus("READY");
                gameService.save(game);
            }
        }
    }

    @Override
    @RequiresRoles("ADMIN")
    @Transactional(rollbackFor = Exception.class)
    public void adjustGroupsManually(Long matchId, Map<Integer, List<Long>> manualGroups) {
        // 管理员手动调整逻辑：清空旧组号，写入新组号
        for (Map.Entry<Integer, List<Long>> entry : manualGroups.entrySet()) {
            Integer groupIndex = entry.getKey();
            for (Long playerId : entry.getValue()) {
                registrationService.update(new LambdaUpdateWrapper<MatchRegistration>()
                        .eq(MatchRegistration::getMatchId, matchId)
                        .eq(MatchRegistration::getPlayerId, playerId)
                        .set(MatchRegistration::getGroupIndex, groupIndex));
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishMatch(Long matchId) {
        MatchEvent match = this.getById(matchId);
        
        // 1. 获取所有需计费人员 (REGISTERED + NO_SHOW)
        List<MatchRegistration> billable = registrationService.getBillableRegistrations(matchId);
        
        if (CollUtil.isNotEmpty(billable) && match.getTotalCost() != null) {
            BigDecimal perPerson = match.getTotalCost().divide(
                    new BigDecimal(billable.size()), 2, RoundingMode.HALF_UP);
            match.setPerPersonCost(perPerson);
        }

        match.setStatus("FINISHED");
        this.updateById(match);
    }
}
