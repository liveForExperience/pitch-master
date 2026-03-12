package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.Player;

/**
 * 球员服务接口
 *
 * @author Gemini
 */
public interface PlayerService extends IService<Player> {

    /**
     * 根据关联用户 ID 获取球员档案
     *
     * @param userId 用户 ID
     * @return 球员档案，不存在返回 null
     */
    Player getByUserId(Long userId);
}
