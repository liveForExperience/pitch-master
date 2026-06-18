package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.MatchGame;
import org.apache.ibatis.annotations.Mapper;

/**
 * 比赛场次 Mapper 接口
 *
 * @author Gemini
 */
@Mapper
public interface MatchGameMapper extends BaseMapper<MatchGame> {
}
