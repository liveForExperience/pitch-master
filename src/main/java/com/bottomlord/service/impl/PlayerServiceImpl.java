package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Player;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.service.PlayerService;
import org.springframework.stereotype.Service;

import com.bottomlord.mapper.ClubMapper;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.entity.Club;
import com.bottomlord.entity.Tournament;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 球员服务实现类 (L3)
 * 支持多层级关联信息查询 (L1 Tournament, L2 Club)
 *
 * @author Gemini
 */
@Service
@Slf4j
public class PlayerServiceImpl extends ServiceImpl<PlayerMapper, Player> implements PlayerService {

    @Autowired
    private ClubMapper clubMapper;

    @Autowired
    private TournamentMapper tournamentMapper;

    @Override
    public Player getByUserId(Long userId) {
        Player player = baseMapper.selectOne(new LambdaQueryWrapper<Player>()
                .eq(Player::getUserId, userId));
        return populateNames(player);
    }

    @Override
    @RequiresRoles("admin")
    @Transactional(rollbackFor = Exception.class)
    public void updateRatingManually(Long playerId, BigDecimal newRating, String reason) {
        Player player = this.getById(playerId);
        if (player == null) throw new IllegalArgumentException("球员不存在");

        log.info("管理员手动修正球员评分: id={}, nickname={}, oldRating={}, newRating={}, reason={}",
                player.getId(), player.getNickname(), player.getRating(), newRating, reason);

        player.setRating(newRating);
        this.updateById(player);

        // TODO: 记录到专门的审计日志表 (AuditLog)
    }

    @Override
    public Player getById(Serializable id) {
        return populateNames(super.getById(id));
    }

    private Player populateNames(Player player) {
        if (player == null) return null;

        // 填充俱乐部名称 (L2)
        if (player.getClubId() != null) {
            Club club = clubMapper.selectById(player.getClubId());
            if (club != null) {
                player.setClubName(club.getName());
            }
        }

        // 填充赛事租户名称 (L1)
        if (player.getTournamentId() != null) {
            Tournament tournament = tournamentMapper.selectById(player.getTournamentId());
            if (tournament != null) {
                player.setTournamentName(tournament.getName());
            }
        }

        return player;
    }
}

