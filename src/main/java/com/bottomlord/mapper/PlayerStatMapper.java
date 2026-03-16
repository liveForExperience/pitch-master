package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.PlayerStat;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PlayerStatMapper extends BaseMapper<PlayerStat> {
}