package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.TournamentAdmin;
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
}
