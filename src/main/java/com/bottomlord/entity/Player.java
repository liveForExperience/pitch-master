package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

/**
 * 全局球员档案
 * 仅保存与特定赛事无关的通用属性；评分数据统一由 player_rating_profile 承载
 */
@Data
@TableName("player")
public class Player {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String nickname;

    private String position;

    private Integer age;

    private String preferredFoot;

    private String gender;

    private Integer height;

    private Integer status;

    /** 仅用于内存计算（分组算法），不映射数据库列，由 player_rating_profile 填充 */
    @TableField(exist = false)
    private BigDecimal rating;

    @TableField(exist = false)
    private String clubName;
}
