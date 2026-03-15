package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("system_status")
public class SystemStatus {
    @TableId
    private String configKey;
    private String configValue;
    private String description;
    private LocalDateTime updatedAt;
}
