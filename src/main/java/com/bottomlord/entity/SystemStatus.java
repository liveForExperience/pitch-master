package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("system_status")
public class SystemStatus extends BaseEntity {
    @TableId
    private String configKey;
    private String configValue;
    private String description;
}
