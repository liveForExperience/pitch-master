package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.GameParticipant;
import org.apache.ibatis.annotations.Mapper;

/**
 * 场次参与者表现 Mapper
 */
@Mapper
public interface GameParticipantMapper extends BaseMapper<GameParticipant> {
}
