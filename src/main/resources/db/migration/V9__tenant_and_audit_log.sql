-- 1. 为核心业务表增加租户标识 (多租户支持)
ALTER TABLE `player` ADD COLUMN `club_id` BIGINT DEFAULT 1 COMMENT '所属俱乐部ID' AFTER `id`;
ALTER TABLE `match_event` ADD COLUMN `club_id` BIGINT DEFAULT 1 COMMENT '所属俱乐部ID' AFTER `id`;

-- 2. 创建比分变动审计日志表 (留痕与审计)
CREATE TABLE `match_score_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `game_id` BIGINT NOT NULL COMMENT '场次ID',
    `score_a` INT NOT NULL COMMENT '变动后的A队比分',
    `score_b` INT NOT NULL COMMENT '变动后的B队比分',
    `operator_id` BIGINT NOT NULL COMMENT '操作人用户ID',
    `type` VARCHAR(20) DEFAULT 'MANUAL' COMMENT '类型：MANUAL-手动修正, GOAL-自动累加',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='比分变动审计表';
