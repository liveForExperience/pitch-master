package com.bottomlord.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.entity.Match;
import com.bottomlord.entity.MatchGame;
import com.bottomlord.entity.MatchGoal;
import com.bottomlord.entity.MatchRegistration;
import com.bottomlord.entity.MatchScoreLog;
import com.bottomlord.entity.Player;
import com.bottomlord.entity.PlayerMutualRating;
import com.bottomlord.entity.PlayerRatingHistory;
import com.bottomlord.entity.PlayerRatingProfile;
import com.bottomlord.entity.PlayerStat;
import com.bottomlord.entity.Role;
import com.bottomlord.entity.Tournament;
import com.bottomlord.entity.TournamentAdmin;
import com.bottomlord.entity.TournamentPlayer;
import com.bottomlord.entity.User;
import com.bottomlord.entity.UserRole;
import com.bottomlord.mapper.GameParticipantMapper;
import com.bottomlord.mapper.MatchGameMapper;
import com.bottomlord.mapper.MatchGoalMapper;
import com.bottomlord.mapper.MatchMapper;
import com.bottomlord.mapper.MatchRegistrationMapper;
import com.bottomlord.mapper.MatchScoreLogMapper;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.mapper.PlayerMutualRatingMapper;
import com.bottomlord.mapper.PlayerRatingHistoryMapper;
import com.bottomlord.mapper.PlayerRatingProfileMapper;
import com.bottomlord.mapper.PlayerStatMapper;
import com.bottomlord.mapper.RoleMapper;
import com.bottomlord.mapper.TournamentAdminMapper;
import com.bottomlord.mapper.TournamentMapper;
import com.bottomlord.mapper.TournamentPlayerMapper;
import com.bottomlord.mapper.UserRoleMapper;
import com.bottomlord.service.TournamentPlayerService;
import com.bottomlord.service.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TournamentServiceImpl extends ServiceImpl<TournamentMapper, Tournament> implements TournamentService {

    @Autowired
    private TournamentAdminMapper tournamentAdminMapper;

    @Autowired
    private RoleMapper roleMapper;

    @Autowired
    private UserRoleMapper userRoleMapper;

    @Autowired
    private MatchMapper matchMapper;

    @Autowired
    private MatchGameMapper matchGameMapper;

    @Autowired
    private MatchGoalMapper matchGoalMapper;

    @Autowired
    private GameParticipantMapper gameParticipantMapper;

    @Autowired
    private MatchScoreLogMapper matchScoreLogMapper;

    @Autowired
    private MatchRegistrationMapper matchRegistrationMapper;

    @Autowired
    private PlayerMutualRatingMapper playerMutualRatingMapper;

    @Autowired
    private PlayerRatingHistoryMapper playerRatingHistoryMapper;

    @Autowired
    private PlayerStatMapper playerStatMapper;

    @Autowired
    private PlayerRatingProfileMapper playerRatingProfileMapper;

    @Autowired
    private TournamentPlayerMapper tournamentPlayerMapper;

    @Autowired
    private PlayerMapper playerMapper;

    @Autowired
    private TournamentPlayerService tournamentPlayerService;

    @Override
    public List<Tournament> listActive() {
        return this.list(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getStatus, 1)
                .isNull(Tournament::getDeletedAt)
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

    @Override
    public List<User> listAdminUsers(Long tournamentId) {
        return tournamentAdminMapper.selectAdminUsersByTournamentId(tournamentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void softDeleteTournament(Long tournamentId, Long userId) {
        Tournament tournament = getById(tournamentId);
        if (tournament == null) {
            throw new IllegalArgumentException("Tournament 不存在");
        }
        if (tournament.getDeletedAt() != null) {
            throw new IllegalStateException("Tournament 已被删除");
        }
        long ongoingCount = matchMapper.selectCount(new LambdaQueryWrapper<Match>()
                .eq(Match::getTournamentId, tournamentId)
                .in(Match::getStatus, "ONGOING", "PUBLISHED")
                .isNull(Match::getDeletedAt));
        if (ongoingCount > 0) {
            throw new IllegalStateException("Tournament 下存在进行中或报名中的赛事，请先处理后再删除");
        }
        tournament.setDeletedAt(LocalDateTime.now());
        tournament.setDeletedBy(userId);
        this.updateById(tournament);
    }

    @Override
    public List<Tournament> listTrashedTournaments() {
        return this.list(new LambdaQueryWrapper<Tournament>()
                .isNotNull(Tournament::getDeletedAt)
                .orderByDesc(Tournament::getDeletedAt));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void restoreTournament(Long tournamentId) {
        Tournament tournament = getById(tournamentId);
        if (tournament == null) {
            throw new IllegalArgumentException("Tournament 不存在");
        }
        if (tournament.getDeletedAt() == null) {
            throw new IllegalStateException("Tournament 未被删除，无需恢复");
        }
        tournament.setDeletedAt(null);
        tournament.setDeletedBy(null);
        this.updateById(tournament);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void permanentDeleteTournament(Long tournamentId) {
        Tournament tournament = getById(tournamentId);
        if (tournament == null) {
            throw new IllegalArgumentException("Tournament 不存在");
        }
        if (tournament.getDeletedAt() == null) {
            throw new IllegalStateException("只能物理删除已软删除的 Tournament");
        }

        // 1. 获取该 Tournament 下所有 match（含软删除）
        List<Match> matches = matchMapper.selectList(new LambdaQueryWrapper<Match>()
                .eq(Match::getTournamentId, tournamentId));

        if (CollUtil.isNotEmpty(matches)) {
            List<Long> matchIds = matches.stream().map(Match::getId).collect(Collectors.toList());

            // 2. 获取所有 game
            List<MatchGame> games = matchGameMapper.selectList(new LambdaQueryWrapper<MatchGame>()
                    .in(MatchGame::getMatchId, matchIds));

            if (CollUtil.isNotEmpty(games)) {
                List<Long> gameIds = games.stream().map(MatchGame::getId).collect(Collectors.toList());

                matchGoalMapper.delete(new LambdaQueryWrapper<MatchGoal>()
                        .in(MatchGoal::getGameId, gameIds));
                gameParticipantMapper.delete(new LambdaQueryWrapper<GameParticipant>()
                        .in(GameParticipant::getGameId, gameIds));
                matchScoreLogMapper.delete(new LambdaQueryWrapper<MatchScoreLog>()
                        .in(MatchScoreLog::getGameId, gameIds));
            }

            // 3. 删除 match_game
            matchGameMapper.delete(new LambdaQueryWrapper<MatchGame>()
                    .in(MatchGame::getMatchId, matchIds));

            // 4. 删除 match_registration 和 player_mutual_rating
            matchRegistrationMapper.delete(new LambdaQueryWrapper<MatchRegistration>()
                    .in(MatchRegistration::getMatchId, matchIds));
            playerMutualRatingMapper.delete(new LambdaQueryWrapper<PlayerMutualRating>()
                    .in(PlayerMutualRating::getMatchId, matchIds));
        }

        // 5. 删除所有 match
        matchMapper.delete(new LambdaQueryWrapper<Match>()
                .eq(Match::getTournamentId, tournamentId));

        // 6. 删除 player_rating_history / player_stat / player_rating_profile（按 tournamentId）
        playerRatingHistoryMapper.delete(new LambdaQueryWrapper<PlayerRatingHistory>()
                .eq(PlayerRatingHistory::getTournamentId, tournamentId));
        playerStatMapper.delete(new LambdaQueryWrapper<PlayerStat>()
                .eq(PlayerStat::getTournamentId, tournamentId));
        playerRatingProfileMapper.delete(new LambdaQueryWrapper<PlayerRatingProfile>()
                .eq(PlayerRatingProfile::getTournamentId, tournamentId));

        // 7. 删除 tournament 本体（DB CASCADE 自动清除 tournament_admin、tournament_player）
        this.removeById(tournamentId);
    }

    @Override
    public List<User> listMembers(Long tournamentId) {
        return tournamentPlayerMapper.selectMemberUsersByTournamentId(tournamentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<String> batchAddMembers(Long tournamentId, List<Long> userIds) {
        List<String> skipped = new ArrayList<>();
        for (Long userId : userIds) {
            Player player = playerMapper.selectOne(new LambdaQueryWrapper<Player>()
                    .eq(Player::getUserId, userId));
            if (player == null) {
                skipped.add("userId=" + userId + "（未完成球员注册）");
                continue;
            }
            try {
                tournamentPlayerService.adminAddPlayer(tournamentId, player.getId());
            } catch (IllegalArgumentException e) {
                skipped.add("userId=" + userId + "（" + e.getMessage() + "）");
            }
        }
        return skipped;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeMember(Long tournamentId, Long userId) {
        Player player = playerMapper.selectOne(new LambdaQueryWrapper<Player>()
                .eq(Player::getUserId, userId));
        if (player == null) {
            throw new IllegalArgumentException("用户未完成球员注册");
        }
        TournamentPlayer tp = tournamentPlayerService.getByTournamentAndPlayer(tournamentId, player.getId());
        if (tp == null) {
            throw new IllegalArgumentException("该用户不是此 Tournament 的成员");
        }
        tp.setJoinStatus("LEFT");
        tournamentPlayerService.updateById(tp);
    }
}
