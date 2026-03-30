package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.TournamentPlayer;
import com.bottomlord.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 球员-Tournament 注册关系 Mapper
 */
@Mapper
public interface TournamentPlayerMapper extends BaseMapper<TournamentPlayer> {

    @Select("SELECT tp.*, p.nickname AS player_nickname, p.position AS player_position " +
            "FROM tournament_player tp " +
            "JOIN player p ON tp.player_id = p.id " +
            "WHERE tp.tournament_id = #{tournamentId} AND tp.join_status = 'ACTIVE'")
    List<TournamentPlayer> selectActiveByTournament(@Param("tournamentId") Long tournamentId);

    @Select("SELECT u.id, u.username, u.real_name, u.status, p.nickname AS player_nickname " +
            "FROM tournament_player tp " +
            "JOIN player p ON tp.player_id = p.id " +
            "JOIN `user` u ON p.user_id = u.id " +
            "WHERE tp.tournament_id = #{tournamentId} AND tp.join_status IN ('ACTIVE', 'PENDING') " +
            "ORDER BY tp.created_at DESC")
    List<User> selectMemberUsersByTournamentId(@Param("tournamentId") Long tournamentId);
}
