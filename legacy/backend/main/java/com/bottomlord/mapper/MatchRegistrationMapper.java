package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.MatchRegistration;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛事报名 Mapper 接口
 *
 * @author Gemini
 */
@Mapper
public interface MatchRegistrationMapper extends BaseMapper<MatchRegistration> {
}
