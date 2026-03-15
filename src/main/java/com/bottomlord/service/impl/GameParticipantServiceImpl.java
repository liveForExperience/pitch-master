package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.GameParticipant;
import com.bottomlord.mapper.GameParticipantMapper;
import com.bottomlord.service.GameParticipantService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 场次参与者表现服务实现类
 */
@Service
public class GameParticipantServiceImpl extends ServiceImpl<GameParticipantMapper, GameParticipant> implements GameParticipantService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStats(List<GameParticipant> participants) {
        if (participants == null || participants.isEmpty()) return;
        
        // 使用 MyBatis-Plus 的 saveOrUpdateBatch
        this.saveOrUpdateBatch(participants);
    }

    @Override
    public List<GameParticipant> listByGameId(Long gameId) {
        return this.list(new LambdaQueryWrapper<GameParticipant>()
                .eq(GameParticipant::getGameId, gameId));
    }
}
