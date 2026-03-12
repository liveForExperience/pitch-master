package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 比赛场次实体
 *
 * @author Gemini
 */
@Data
@TableName("match_game")
public class MatchGame implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Integer teamAIndex;

    private Integer teamBIndex;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer overtimeMinutes;

    private Integer scoreA;

    private Integer scoreB;

    /**
     * 状态：READY, PLAYING, FINISHED
     */
    private String status;
}
