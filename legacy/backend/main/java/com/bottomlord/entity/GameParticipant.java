package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

/**
 * 场次参与者表现 (L5 统计单元)
 *
 * @author Gemini
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("game_participant")
public class GameParticipant extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long gameId;

    private Long playerId;

    private Integer goals;

    private Integer assists;

    private Boolean isMvp;

    /**
     * 本场评分
     */
    private BigDecimal rating;
}
