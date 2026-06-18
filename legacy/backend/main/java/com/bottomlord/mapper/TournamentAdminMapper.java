package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.TournamentAdmin;
import com.bottomlord.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * Tournament 管理员关联 Mapper
 */
@Mapper
public interface TournamentAdminMapper extends BaseMapper<TournamentAdmin> {

    @Select("SELECT COUNT(*) > 0 FROM tournament_admin WHERE tournament_id = #{tournamentId} AND user_id = #{userId}")
    boolean existsByTournamentAndUser(@Param("tournamentId") Long tournamentId, @Param("userId") Long userId);

    @Select("SELECT tournament_id FROM tournament_admin WHERE user_id = #{userId}")
    List<Long> selectTournamentIdsByUserId(@Param("userId") Long userId);

    @Select("SELECT u.id, u.username, u.real_name, u.status FROM `user` u " +
            "INNER JOIN tournament_admin ta ON ta.user_id = u.id " +
            "WHERE ta.tournament_id = #{tournamentId}")
    List<User> selectAdminUsersByTournamentId(@Param("tournamentId") Long tournamentId);
}
