package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("tournament")
public class Tournament extends BaseEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private Integer status;

    /**
     * 加入方式: OPEN / APPROVAL
     */
    private String joinMode;

    /**
     * Tournament 图标 URL
     */
    private String logo;

    /**
     * 最大球员数限制
     */
    private Integer maxPlayers;

    /**
     * 软删除时间
     */
    private LocalDateTime deletedAt;

    /**
     * 删除操作人用户ID
     */
    private Long deletedBy;
}
