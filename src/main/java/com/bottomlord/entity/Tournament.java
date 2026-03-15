package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 顶级赛事租户 (L1)
 *
 * @author Gemini
 */
@Data
@TableName("tournament")
public class Tournament implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    /**
     * 规则配置 (JSON 格式，存储全局分配算法、费用计算规则等)
     */
    private String config;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
