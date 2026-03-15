package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.Tournament;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛事租户 Mapper
 */
@Mapper
public interface TournamentMapper extends BaseMapper<Tournament> {
}
