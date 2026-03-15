package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.Match;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛事活动 Mapper 接口
 *
 * @author Gemini
 */
@Mapper
public interface MatchMapper extends BaseMapper<Match> {
}
