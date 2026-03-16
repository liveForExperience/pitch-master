package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 球员FM属性 (1-20)
 */
@Data
@TableName("player_attribute")
public class PlayerAttribute {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long playerId;

    /** 速度 1-20 */
    private Integer pace;

    /** 射门 1-20 */
    private Integer shooting;

    /** 传球 1-20 */
    private Integer passing;

    /** 盘带 1-20 */
    private Integer dribbling;

    /** 防守 1-20 */
    private Integer defending;

    /** 体能 1-20 */
    private Integer physical;

    /** 虚拟身价 */
    private BigDecimal marketValue;

    private LocalDateTime updateTime;
}