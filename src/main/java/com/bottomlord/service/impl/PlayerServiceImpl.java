package com.bottomlord.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bottomlord.entity.Player;
import com.bottomlord.mapper.PlayerMapper;
import com.bottomlord.service.PlayerService;
import org.springframework.stereotype.Service;

/**
 * 球员服务实现类
 *
 * @author Gemini
 */
@Service
public class PlayerServiceImpl extends ServiceImpl<PlayerMapper, Player> implements PlayerService {

    @Override
    public Player getByUserId(Long userId) {
        return baseMapper.selectOne(new LambdaQueryWrapper<Player>()
                .eq(Player::getUserId, userId));
    }
}
