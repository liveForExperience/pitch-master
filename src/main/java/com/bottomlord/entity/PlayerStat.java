package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 球员核心统计数据
 */
@Data
@TableName("player_stat")
public class PlayerStat {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long playerId;

    private Integer totalMatches;

    private Integer wins;

    private Integer draws;

    private Integer losses;

    private Integer totalGoals;

    private Integer totalAssists;

    private Integer totalMvps;

    private Integer cleanSheets;

    /** 最近5场走势 (W,W,D,L,W) */
    private String recentForm;

    private LocalDateTime updateTime;
}