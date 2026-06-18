-- V3__match_operation_and_stats.sql
-- 1. 比赛场次表
CREATE TABLE `match_game` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `match_id` BIGINT NOT NULL,
    `team_a_index` INT NOT NULL COMMENT 'A队序号',
    `team_b_index` INT NOT NULL COMMENT 'B队序号',
    `start_time` DATETIME DEFAULT NULL,
    `end_time` DATETIME DEFAULT NULL,
    `overtime_minutes` INT DEFAULT 0,
    `score_a` INT DEFAULT 0,
    `score_b` INT DEFAULT 0,
    `status` VARCHAR(20) DEFAULT 'READY' COMMENT 'READY, PLAYING, FINISHED',
    `lock_user_id` BIGINT DEFAULT NULL COMMENT '锁定用户',
    `lock_time` DATETIME DEFAULT NULL COMMENT '锁定时间',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_game_match` FOREIGN KEY (`match_id`) REFERENCES `match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='比赛对阵场次';

-- 2. 比赛进球记录表
CREATE TABLE `match_goal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `game_id` BIGINT NOT NULL,
    `team_index` INT NOT NULL COMMENT '0或1',
    `scorer_id` BIGINT DEFAULT NULL COMMENT '进球人',
    `assistant_id` BIGINT DEFAULT NULL COMMENT '助攻人',
    `type` VARCHAR(20) DEFAULT 'NORMAL' COMMENT 'NORMAL, OWN_GOAL',
    `occurred_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_goal_game` FOREIGN KEY (`game_id`) REFERENCES `match_game` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='进球明细';

-- 3. 场次参与者数据表
CREATE TABLE `game_participant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `game_id` BIGINT NOT NULL,
    `player_id` BIGINT NOT NULL,
    `goals` INT DEFAULT 0,
    `assists` INT DEFAULT 0,
    `is_mvp` TINYINT DEFAULT 0,
    `rating` DECIMAL(3, 1) DEFAULT 6.0,
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_part_game` FOREIGN KEY (`game_id`) REFERENCES `match_game` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_part_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='单场比赛球员数据';

-- 4. 比分审计日志
CREATE TABLE `match_score_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `game_id` BIGINT NOT NULL,
    `score_a` INT NOT NULL,
    `score_b` INT NOT NULL,
    `type` VARCHAR(20) DEFAULT 'GOAL' COMMENT 'GOAL, MANUAL, CORRECTION',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='比分变动流水';

-- 5. 球员互评记录表
CREATE TABLE `player_mutual_rating` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `match_id` BIGINT NOT NULL,
    `from_player_id` BIGINT NOT NULL,
    `to_player_id` BIGINT NOT NULL,
    `rating_skill` DECIMAL(3, 1),
    `rating_fitness` DECIMAL(3, 1),
    `rating_attitude` DECIMAL(3, 1),
    `rating_vision` DECIMAL(3, 1),
    `is_mvp_vote` TINYINT DEFAULT 0,
    `comment` VARCHAR(255),
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rate_match` FOREIGN KEY (`match_id`) REFERENCES `match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='球员互评';
