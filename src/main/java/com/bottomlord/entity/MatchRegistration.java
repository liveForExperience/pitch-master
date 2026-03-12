package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 赛事报名关系实体
 *
 * @author Gemini
 */
@Data
@TableName("match_registration")
public class MatchRegistration implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Long playerId;

    /**
     * 分配的小组序号 (0-N)
     */
    private Integer groupIndex;

    /**
     * 状态：REGISTERED, CANCELLED, NO_SHOW
     */
    private String status;

    private LocalDateTime createdAt;
}
