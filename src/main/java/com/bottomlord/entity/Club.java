package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 俱乐部实体 (L2)
 *
 * @author Gemini
 */
@Data
@TableName("club")
public class Club implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属赛事 (租户)
     */
    private Long tournamentId;

    private String name;

    private String logo;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
