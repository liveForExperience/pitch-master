package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 球员关系实体 (意愿与默契)
 * 
 * @author Gemini
 */
@Data
@TableName("player_relationship")
public class PlayerRelationship implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long fromPlayerId;

    private Long toPlayerId;

    /**
     * 配合意愿 (0-10)
     */
    private Integer willingness;

    /**
     * 历史默契 (共同场次)
     */
    private Integer chemistry;

    private LocalDateTime updatedAt;
}
