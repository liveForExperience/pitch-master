package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 场次参与者表现 (L5 统计单元)
 *
 * @author Gemini
 */
@Data
@TableName("game_participant")
public class GameParticipant implements Serializable {

    private static final long serialVersionUID = 1L;

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

    private LocalDateTime createdAt;
}
