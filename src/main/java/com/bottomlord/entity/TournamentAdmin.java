package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Tournament 管理员关联实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("tournament_admin")
public class TournamentAdmin extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tournamentId;

    private Long userId;
}
