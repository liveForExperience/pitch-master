-- V13: 球员多维度互评与 MVP 评选
CREATE TABLE `player_mutual_rating` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `match_id` BIGINT NOT NULL COMMENT '关联比赛ID',
    `from_player_id` BIGINT NOT NULL COMMENT '评价人球员ID',
    `to_player_id` BIGINT NOT NULL COMMENT '被评价人球员ID',
    
    -- 多维度评分 (1.0 - 10.0)
    `rating_skill` DECIMAL(3,2) DEFAULT 5.00 COMMENT '技术得分',
    `rating_fitness` DECIMAL(3,2) DEFAULT 5.00 COMMENT '体能得分',
    `rating_attitude` DECIMAL(3,2) DEFAULT 5.00 COMMENT '态度/积极性得分',
    `rating_vision` DECIMAL(3,2) DEFAULT 5.00 COMMENT '意识/大局观得分',
    
    `is_mvp_vote` TINYINT(1) DEFAULT 0 COMMENT '是否投为 MVP',
    `comment` VARCHAR(255) DEFAULT NULL COMMENT '简短评语',
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 约束：同一场比赛，A 只能给 B 打一次分
    UNIQUE KEY `uk_match_from_to` (`match_id`, `from_player_id`, `to_player_id`),
    INDEX `idx_to_player` (`to_player_id`),
    INDEX `idx_match` (`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='球员互评记录表';
