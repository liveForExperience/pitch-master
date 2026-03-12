package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 球员档案实体
 *
 * @author Gemini
 */
@Data
@TableName("player")
public class Player implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /**
     * 球场昵称
     */
    private String nickname;

    /**
     * 擅长位置：GK, DF, MF, FW
     */
    private String position;

    /**
     * 综合技术评分 (1.0-10.0)
     */
    private BigDecimal rating;

    private Integer age;

    /**
     * 擅长脚：LEFT, RIGHT, BOTH
     */
    private String preferredFoot;

    /**
     * 状态：1-活跃，0-隐退
     */
    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
