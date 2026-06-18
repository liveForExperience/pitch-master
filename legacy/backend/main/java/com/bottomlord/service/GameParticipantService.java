package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.GameParticipant;

import java.util.List;

/**
 * 场次参与者表现服务接口
 */
public interface GameParticipantService extends IService<GameParticipant> {

    /**
     * 批量更新某场比赛下所有球员的表现
     *
     * @param participants 表现数据列表
     */
    void batchUpdateStats(List<GameParticipant> participants);

    /**
     * 根据场次 ID 获取参与者列表
     */
    List<GameParticipant> listByGameId(Long gameId);
}
