package com.bottomlord.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bottomlord.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 球员互评实体
 * 支持多维度评分与 MVP 评选
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("player_mutual_rating")
public class PlayerMutualRating extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long matchId;

    private Long fromPlayerId;

    private Long toPlayerId;

    /**
     * 技术评分
     */
    private BigDecimal ratingSkill;

    /**
     * 体能评分
     */
    private BigDecimal ratingFitness;

    /**
     * 态度/积极性
     */
    private BigDecimal ratingAttitude;

    /**
     * 意识/大局观
     */
    private BigDecimal ratingVision;

    /**
     * 是否投为 MVP (1票)
     */
    private Boolean isMvpVote;

    /**
     * 评语
     */
    private String comment;

    /**
     * 获取多维度平均分 (用于一键展示)
     */
    public BigDecimal getAverageRating() {
        BigDecimal sum = ratingSkill.add(ratingFitness).add(ratingAttitude).add(ratingVision);
        return sum.divide(new BigDecimal("4"), 2, RoundingMode.HALF_UP);
    }
}
