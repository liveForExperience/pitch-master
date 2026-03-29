-- V14__platform_concept_and_player_split.sql
-- 引入平台概念：Tournament 上层管理体系，球员属性拆分（全局 vs Tournament 维度）

-- ============================================================
-- 1. 角色体系：新增 platform_admin 角色
-- ============================================================
INSERT INTO `role` (`name`, `description`) VALUES ('platform_admin', '平台超级管理员');

-- 将现有 admin 角色用户迁移到 platform_admin
INSERT INTO `user_role` (`user_id`, `role_id`)
SELECT ur.user_id, (SELECT id FROM `role` WHERE name = 'platform_admin')
FROM `user_role` ur
JOIN `role` r ON ur.role_id = r.id
WHERE r.name = 'admin';

-- ============================================================
-- 2. Tournament 表增强
-- ============================================================
ALTER TABLE `tournament`
    ADD COLUMN `join_mode` VARCHAR(20) NOT NULL DEFAULT 'OPEN' COMMENT '加入方式: OPEN / APPROVAL' AFTER `status`,
    ADD COLUMN `logo` VARCHAR(255) DEFAULT NULL COMMENT 'Tournament 图标 URL' AFTER `join_mode`,
    ADD COLUMN `max_players` INT DEFAULT NULL COMMENT '最大球员数限制' AFTER `logo`;

-- ============================================================
-- 3. Tournament 管理员关联表
-- ============================================================
CREATE TABLE `tournament_admin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_tournament_user` (`tournament_id`, `user_id`),
    CONSTRAINT `fk_ta_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tournament 管理员关联表';

-- 将现有 admin 用户设为默认 Tournament 的管理员
INSERT INTO `tournament_admin` (`tournament_id`, `user_id`)
SELECT 1, ur.user_id
FROM `user_role` ur
JOIN `role` r ON ur.role_id = r.id
WHERE r.name = 'admin';

-- ============================================================
-- 4. Player 表：新增全局属性字段
-- ============================================================
ALTER TABLE `player`
    ADD COLUMN `gender` VARCHAR(10) DEFAULT NULL COMMENT '性别: MALE / FEMALE' AFTER `preferred_foot`,
    ADD COLUMN `height` INT DEFAULT NULL COMMENT '身高(cm)' AFTER `gender`;

-- ============================================================
-- 5. 新建 tournament_player 表（球员-Tournament 注册 + Tournament 维度数据）
-- ============================================================
CREATE TABLE `tournament_player` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` BIGINT NOT NULL COMMENT '所属 Tournament',
    `player_id` BIGINT NOT NULL COMMENT '球员ID（全局）',
    `club_id` BIGINT DEFAULT NULL COMMENT '在该 Tournament 下所属俱乐部',
    `rating` DECIMAL(4, 2) DEFAULT 5.00 COMMENT 'Tournament 维度综合评分',
    `rating_version` TINYINT NOT NULL DEFAULT 2 COMMENT '评分体系版本',
    `last_match_time` DATETIME DEFAULT NULL COMMENT '该 Tournament 下最后比赛时间',
    `last_attendance_time` DATETIME DEFAULT NULL COMMENT '该 Tournament 下最后出勤时间',
    `join_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'PENDING / ACTIVE / LEFT',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1=活跃, 0=隐退',
    `created_by` BIGINT DEFAULT NULL,
    `updated_by` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_tournament_player` (`tournament_id`, `player_id`),
    KEY `idx_tp_player` (`player_id`),
    CONSTRAINT `fk_tp_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tp_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='球员-Tournament 注册关系及 Tournament 维度数据';

-- 从现有 player 表迁移 Tournament 维度数据到 tournament_player
INSERT INTO `tournament_player` (
    `tournament_id`, `player_id`, `club_id`,
    `rating`, `rating_version`,
    `last_match_time`, `last_attendance_time`,
    `join_status`, `status`
)
SELECT
    `tournament_id`, `id`, `real_club_id`,
    `rating`, `rating_version`,
    `last_match_time`, `last_attendance_time`,
    'ACTIVE', `status`
FROM `player`
WHERE `tournament_id` IS NOT NULL;

-- ============================================================
-- 6. player_rating_profile 增加 tournament_id
-- ============================================================
ALTER TABLE `player_rating_profile`
    ADD COLUMN `tournament_id` BIGINT DEFAULT NULL COMMENT '所属 Tournament' AFTER `player_id`;

-- 回填 tournament_id（从 player 表获取）
UPDATE `player_rating_profile` prp
JOIN `player` p ON prp.player_id = p.id
SET prp.tournament_id = p.tournament_id;

-- 删除旧唯一键，创建新的复合唯一键
ALTER TABLE `player_rating_profile`
    DROP INDEX `uk_profile_player`,
    ADD UNIQUE KEY `uk_profile_player_tournament` (`player_id`, `tournament_id`);

-- ============================================================
-- 7. player_stat 增加 tournament_id
-- ============================================================
ALTER TABLE `player_stat`
    ADD COLUMN `tournament_id` BIGINT DEFAULT NULL COMMENT '所属 Tournament' AFTER `player_id`;

-- 回填（从 player 表获取）
UPDATE `player_stat` ps
JOIN `player` p ON ps.player_id = p.id
SET ps.tournament_id = p.tournament_id;

-- 删除旧唯一键，创建新的复合唯一键
ALTER TABLE `player_stat`
    DROP INDEX `player_id`,
    ADD UNIQUE KEY `uk_stat_player_tournament` (`player_id`, `tournament_id`);

-- ============================================================
-- 8. player_rating_history 增加 tournament_id
-- ============================================================
ALTER TABLE `player_rating_history`
    ADD COLUMN `tournament_id` BIGINT DEFAULT NULL COMMENT '所属 Tournament' AFTER `player_id`;

-- 回填（从 player 表获取）
UPDATE `player_rating_history` prh
JOIN `player` p ON prh.player_id = p.id
SET prh.tournament_id = p.tournament_id;

ALTER TABLE `player_rating_history`
    ADD KEY `idx_prh_tournament` (`tournament_id`);

-- ============================================================
-- 9. 标记 player 表旧字段为废弃（暂不删除，确保兼容过渡）
-- 后续 Migration 中在确认所有引用迁移完成后再删除：
--   tournament_id, real_club_id, rating, rating_version,
--   last_match_time, last_attendance_time
-- ============================================================
-- 此处不做 DROP COLUMN，以保证过渡期兼容性
