package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("player_relationship")
public class PlayerRelationship extends BaseEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long fromPlayerId;
    private Long toPlayerId;
    private Integer willingness;
    private Integer chemistry;
}
