-- V2__core_domain_schema.sql
-- 1. 赛事(租户)表
CREATE TABLE `tournament` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(128) NOT NULL COMMENT '赛事名称',
    `description` TEXT COMMENT '赛事描述',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1:活跃, 0:归档',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='赛事(租户)';

-- 2. 俱乐部表
CREATE TABLE `club` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` BIGINT NOT NULL COMMENT '所属赛事ID',
    `name` VARCHAR(64) NOT NULL COMMENT '俱乐部名称',
    `description` VARCHAR(255),
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_club_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='俱乐部';

-- 3. 球员档案表
CREATE TABLE `player` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT DEFAULT NULL COMMENT '关联用户ID',
    `tournament_id` BIGINT NOT NULL COMMENT '所属赛事ID',
    `real_club_id` BIGINT DEFAULT NULL COMMENT '所属真实俱乐部ID',
    `nickname` VARCHAR(64) NOT NULL COMMENT '球场昵称',
    `position` VARCHAR(20) DEFAULT 'UNKNOWN' COMMENT '擅长位置：GK, DF, MF, FW',
    `rating` DECIMAL(4, 2) DEFAULT 5.00 COMMENT '综合技术评分 (1.0-10.0)',
    `age` INT DEFAULT NULL COMMENT '年龄',
    `preferred_foot` VARCHAR(10) DEFAULT 'RIGHT' COMMENT '擅长脚：LEFT, RIGHT, BOTH',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-活跃，0-隐退',
    `last_match_time` DATETIME DEFAULT NULL COMMENT '最后一次比赛时间 (用于衰减)',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_player_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='球员档案';

-- 4. 赛事活动表 (Match)
CREATE TABLE `match` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` BIGINT NOT NULL COMMENT '所属赛事ID',
    `title` VARCHAR(128) NOT NULL COMMENT '赛事标题',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `registration_deadline` DATETIME NOT NULL COMMENT '报名截止时间',
    `cancel_deadline` DATETIME DEFAULT NULL COMMENT '取消报名截止时间',
    `location` VARCHAR(255) DEFAULT NULL COMMENT '地点',
    `registration_type` VARCHAR(20) DEFAULT 'PLAYER' COMMENT '报名主体类型: PLAYER (散拼), CLUB (整队)',
    `num_groups` INT NOT NULL DEFAULT 2 COMMENT '需要分配的小组数量',
    `players_per_group` INT DEFAULT 8 COMMENT '每组建议人数',
    `planned_game_count` INT DEFAULT 1 COMMENT '计划进行的场次数量',
    `total_cost` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总费用',
    `per_person_cost` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '人均费用',
    `status` VARCHAR(20) DEFAULT 'PREPARING' COMMENT 'PREPARING, PUBLISHED, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, SETTLED, CANCELLED',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_match_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='赛事活动';

-- 5. 赛事报名表
CREATE TABLE `match_registration` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `match_id` BIGINT NOT NULL,
    `player_id` BIGINT NOT NULL,
    `group_index` INT DEFAULT NULL COMMENT '分配的分组序号 (0-N)',
    `status` VARCHAR(20) DEFAULT 'REGISTERED' COMMENT 'REGISTERED, CANCELLED, NO_SHOW',
    `payment_status` VARCHAR(20) DEFAULT 'UNPAID' COMMENT 'UNPAID, PAID',
    `is_exempt` TINYINT(1) DEFAULT 0 COMMENT '是否豁免费用',
    `is_mvp` TINYINT DEFAULT 0 COMMENT '是否为本场MVP',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_match_player` (`match_id`, `player_id`),
    CONSTRAINT `fk_reg_match` FOREIGN KEY (`match_id`) REFERENCES `match` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reg_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='赛事报名表';

-- 6. 球员关系表
CREATE TABLE `player_relationship` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `from_player_id` BIGINT NOT NULL,
    `to_player_id` BIGINT NOT NULL,
    `willingness` INT DEFAULT 0 COMMENT '配合意愿分',
    `chemistry` INT DEFAULT 0 COMMENT '历史共同参赛次数',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_relationship` (`from_player_id`, `to_player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='球员默契与意愿关系表';

CREATE TABLE IF NOT EXISTS `player_attribute` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `player_id` BIGINT NOT NULL UNIQUE,
    `pace` INT DEFAULT 10 COMMENT "速度 1-20",
    `shooting` INT DEFAULT 10 COMMENT "射门 1-20",
    `passing` INT DEFAULT 10 COMMENT "传球 1-20",
    `dribbling` INT DEFAULT 10 COMMENT "盘带 1-20",
    `defending` INT DEFAULT 10 COMMENT "防守 1-20",
    `physical` INT DEFAULT 10 COMMENT "体能 1-20",
    `market_value` DECIMAL(15,2) DEFAULT 0.00 COMMENT "虚拟身价",
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `player_stat` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `player_id` BIGINT NOT NULL UNIQUE,
    `total_matches` INT DEFAULT 0,
    `wins` INT DEFAULT 0,
    `draws` INT DEFAULT 0,
    `losses` INT DEFAULT 0,
    `total_goals` INT DEFAULT 0,
    `total_assists` INT DEFAULT 0,
    `total_mvps` INT DEFAULT 0,
    `clean_sheets` INT DEFAULT 0,
    `recent_form` VARCHAR(50) DEFAULT "" COMMENT "近5场趋势",
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `player_rating_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `player_id` BIGINT NOT NULL,
    `match_id` BIGINT,
    `old_rating` DECIMAL(10,2),
    `new_rating` DECIMAL(10,2),
    `delta` DECIMAL(10,2),
    `change_reason` VARCHAR(50),
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;