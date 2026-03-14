package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.PlayerRelationship;
import com.bottomlord.mapper.PlayerRelationshipMapper;
import com.bottomlord.service.PlayerRelationshipService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 球员关系服务实现类
 * 
 * @author Gemini
 */
@Service
public class PlayerRelationshipServiceImpl extends ServiceImpl<PlayerRelationshipMapper, PlayerRelationship> implements PlayerRelationshipService {

    @Override
    public List<PlayerRelationship> listByPlayer(Long fromPlayerId) {
        return this.list(new LambdaQueryWrapper<PlayerRelationship>()
                .eq(PlayerRelationship::getFromPlayerId, fromPlayerId));
    }

    @Override
    public List<PlayerRelationship> listBatchRelationships(List<Long> playerIds) {
        return this.list(new LambdaQueryWrapper<PlayerRelationship>()
                .in(PlayerRelationship::getFromPlayerId, playerIds)
                .in(PlayerRelationship::getToPlayerId, playerIds));
    }
}
