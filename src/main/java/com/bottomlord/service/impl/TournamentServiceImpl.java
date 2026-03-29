package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Role;
import com.bottomlord.entity.Tournament;
import com.bottomlord.entity.TournamentAdmin;
import com.bottomlord.entity.UserRole;
import com.bottomlord.mapper.RoleMapper;
import com.bottomlord.mapper.TournamentAdminMapper;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.mapper.UserRoleMapper;
import com.bottomlord.service.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TournamentServiceImpl extends ServiceImpl<TournamentMapper, Tournament> implements TournamentService {

    @Autowired
    private TournamentAdminMapper tournamentAdminMapper;

    @Autowired
    private RoleMapper roleMapper;

    @Autowired
    private UserRoleMapper userRoleMapper;

    @Override
    public List<Tournament> listActive() {
        return this.list(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getStatus, 1)
                .orderByDesc(Tournament::getCreatedAt));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tournament createTournament(Tournament tournament) {
        if (tournament.getStatus() == null) {
            tournament.setStatus(1);
        }
        if (tournament.getJoinMode() == null) {
            tournament.setJoinMode("OPEN");
        }
        this.save(tournament);
        return tournament;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addAdmin(Long tournamentId, Long userId) {
        if (tournamentAdminMapper.existsByTournamentAndUser(tournamentId, userId)) {
            throw new IllegalArgumentException("该用户已是此 Tournament 的管理员");
        }
        TournamentAdmin admin = new TournamentAdmin();
        admin.setTournamentId(tournamentId);
        admin.setUserId(userId);
        tournamentAdminMapper.insert(admin);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeAdmin(Long tournamentId, Long userId) {
        tournamentAdminMapper.delete(new LambdaQueryWrapper<TournamentAdmin>()
                .eq(TournamentAdmin::getTournamentId, tournamentId)
                .eq(TournamentAdmin::getUserId, userId));
    }

    @Override
    public boolean isAdmin(Long tournamentId, Long userId) {
        if (isPlatformAdmin(userId)) {
            return true;
        }
        return tournamentAdminMapper.existsByTournamentAndUser(tournamentId, userId);
    }

    @Override
    public boolean isPlatformAdmin(Long userId) {
        Role platformAdminRole = roleMapper.selectOne(new LambdaQueryWrapper<Role>()
                .eq(Role::getName, "platform_admin"));
        if (platformAdminRole == null) {
            return false;
        }
        Long count = userRoleMapper.selectCount(new LambdaQueryWrapper<UserRole>()
                .eq(UserRole::getUserId, userId)
                .eq(UserRole::getRoleId, platformAdminRole.getId()));
        return count != null && count > 0;
    }

    @Override
    public List<Long> getAdminTournamentIds(Long userId) {
        return tournamentAdminMapper.selectTournamentIdsByUserId(userId);
    }
}
