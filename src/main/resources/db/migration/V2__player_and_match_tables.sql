-- 球员档案表
CREATE TABLE `player` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT DEFAULT NULL COMMENT '关联用户ID',
    `nickname` VARCHAR(64) NOT NULL COMMENT '球场昵称',
    `position` VARCHAR(20) DEFAULT 'UNKNOWN' COMMENT '擅长位置：GK, DF, MF, FW',
    `rating` DECIMAL(3, 1) DEFAULT 5.0 COMMENT '综合技术评分 (1.0-10.0)',
    `age` INT DEFAULT NULL COMMENT '年龄',
    `preferred_foot` VARCHAR(10) DEFAULT 'RIGHT' COMMENT '擅长脚：LEFT, RIGHT, BOTH',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-活跃，0-隐退',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 赛事活动表
CREATE TABLE `match_event` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(128) NOT NULL COMMENT '赛事标题',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `location` VARCHAR(255) DEFAULT NULL COMMENT '地点',
    `num_groups` INT NOT NULL DEFAULT 2 COMMENT '需要分配的小组数量',
    `total_cost` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总费用',
    `per_person_cost` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '人均费用',
    `status` VARCHAR(20) DEFAULT 'SCHEDULED' COMMENT '状态：SCHEDULED, ONGOING, FINISHED, CANCELLED',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 球员关系表 (意愿与默契)
CREATE TABLE `player_relationship` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `from_player_id` BIGINT NOT NULL COMMENT '发起方球员ID',
    `to_player_id` BIGINT NOT NULL COMMENT '目标方球员ID',
    `willingness` INT DEFAULT 0 COMMENT '配合意愿分 (0-1, 未来扩展0-10)',
    `chemistry` INT DEFAULT 0 COMMENT '历史共同参赛次数 (默契度)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_relationship` (`from_player_id`, `to_player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 赛事报名表
CREATE TABLE `match_registration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `match_id` BIGINT NOT NULL,
    `player_id` BIGINT NOT NULL,
    `group_index` INT DEFAULT NULL COMMENT '分配的分组序号 (0-N)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_match_player` (`match_id`, `player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
