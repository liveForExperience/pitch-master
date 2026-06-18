package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 俱乐部实体 (L2)
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("club")
public class Club extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属赛事 (租户)
     */
    private Long tournamentId;

    private String name;
}
