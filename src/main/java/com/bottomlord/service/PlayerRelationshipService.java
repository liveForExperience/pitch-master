package com.bottomlord.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bottomlord.entity.PlayerRelationship;

import java.util.List;

/**
 * 球员关系服务接口
 * 
 * @author Gemini
 */
public interface PlayerRelationshipService extends IService<PlayerRelationship> {

    /**
     * 获取指定球员与其他所有球员的关系列表
     *
     * @param fromPlayerId 发起方球员ID
     * @return 关系列表
     */
    List<PlayerRelationship> listByPlayer(Long fromPlayerId);

    /**
     * 获取参与本次分配的所有球员之间的关系网
     *
     * @param playerIds 球员ID集合
     * @return 关系网
     */
    List<PlayerRelationship> listBatchRelationships(List<Long> playerIds);
}
