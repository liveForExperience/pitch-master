package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.MatchGoal;
import org.apache.ibatis.annotations.Mapper;

/**
 * 进球记录 Mapper 接口
 *
 * @author Gemini
 */
@Mapper
public interface MatchGoalMapper extends BaseMapper<MatchGoal> {
}
