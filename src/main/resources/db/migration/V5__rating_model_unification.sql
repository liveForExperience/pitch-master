ALTER TABLE `player`
    MODIFY COLUMN `rating` DECIMAL(4, 2) DEFAULT 5.00 COMMENT '综合评分 (1.0-20.0)',
    ADD COLUMN `rating_version` TINYINT NOT NULL DEFAULT 2 COMMENT '评分体系版本' AFTER `rating`,
    ADD COLUMN `last_attendance_time` DATETIME DEFAULT NULL COMMENT '最后一次有效出勤时间' AFTER `last_match_time`;

CREATE TABLE `player_rating_profile` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `player_id` BIGINT NOT NULL,
    `skill_rating` DECIMAL(4, 2) NOT NULL DEFAULT 5.00,
    `performance_rating` DECIMAL(4, 2) NOT NULL DEFAULT 5.00,
    `engagement_rating` DECIMAL(4, 2) NOT NULL DEFAULT 5.00,
    `provisional_matches` INT NOT NULL DEFAULT 0,
    `appearance_count` INT NOT NULL DEFAULT 0,
    `active_streak_weeks` INT NOT NULL DEFAULT 0,
    `last_attendance_time` DATETIME DEFAULT NULL,
    `last_decay_time` DATETIME DEFAULT NULL,
    `rating_version` TINYINT NOT NULL DEFAULT 2,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_profile_player` (`player_id`),
    KEY `idx_profile_last_attendance_time` (`last_attendance_time`),
    CONSTRAINT `fk_profile_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='球员评分档案';

ALTER TABLE `player_rating_history`
    ADD COLUMN `dimension` VARCHAR(20) DEFAULT 'TOTAL' COMMENT 'SKILL, PERFORMANCE, ENGAGEMENT, TOTAL, DECAY, ADMIN' AFTER `match_id`,
    ADD COLUMN `source_type` VARCHAR(30) DEFAULT 'LEGACY' COMMENT 'MATCH_SETTLEMENT, INACTIVITY_DECAY, RETURN_BONUS, ADMIN_CORRECTION, INITIALIZATION, LEGACY' AFTER `dimension`,
    ADD COLUMN `old_value` DECIMAL(10, 2) DEFAULT NULL AFTER `new_rating`,
    ADD COLUMN `new_value` DECIMAL(10, 2) DEFAULT NULL AFTER `old_value`,
    ADD COLUMN `reason_code` VARCHAR(50) DEFAULT NULL AFTER `change_reason`,
    ADD COLUMN `reason_detail` VARCHAR(255) DEFAULT NULL AFTER `reason_code`,
    ADD COLUMN `operator_user_id` BIGINT DEFAULT NULL AFTER `reason_detail`;

ALTER TABLE `player_rating_history`
    ADD KEY `idx_prh_dimension_source` (`dimension`, `source_type`),
    ADD KEY `idx_prh_player_created` (`player_id`, `create_time`);

UPDATE `player`
SET `rating` = 5.00,
    `rating_version` = 2,
    `last_attendance_time` = COALESCE(`last_match_time`, `last_attendance_time`);

INSERT INTO `player_rating_profile` (
    `player_id`,
    `skill_rating`,
    `performance_rating`,
    `engagement_rating`,
    `provisional_matches`,
    `appearance_count`,
    `active_streak_weeks`,
    `last_attendance_time`,
    `last_decay_time`,
    `rating_version`
)
SELECT
    `id`,
    5.00,
    5.00,
    5.00,
    0,
    0,
    0,
    COALESCE(`last_match_time`, `last_attendance_time`),
    NULL,
    2
FROM `player`;

UPDATE `player_rating_history`
SET `dimension` = 'TOTAL',
    `source_type` = 'LEGACY',
    `old_value` = COALESCE(`old_value`, `old_rating`),
    `new_value` = COALESCE(`new_value`, `new_rating`),
    `reason_code` = COALESCE(`reason_code`, 'LEGACY'),
    `reason_detail` = COALESCE(`reason_detail`, `change_reason`);

INSERT INTO `player_rating_history` (
    `player_id`,
    `match_id`,
    `dimension`,
    `source_type`,
    `old_rating`,
    `new_rating`,
    `old_value`,
    `new_value`,
    `delta`,
    `change_reason`,
    `reason_code`,
    `reason_detail`,
    `create_time`
)
SELECT
    `id`,
    NULL,
    'TOTAL',
    'INITIALIZATION',
    5.00,
    5.00,
    5.00,
    5.00,
    0.00,
    'INITIALIZATION',
    'INITIALIZATION',
    'rating-model-v2-bootstrap',
    NOW()
FROM `player`;
