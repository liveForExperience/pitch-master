-- V17: 强化领域模型约束
-- 1. 强制 User 与 Player 的 1:1 关系
ALTER TABLE `player` DROP INDEX `idx_user_id`;
ALTER TABLE `player` ADD UNIQUE INDEX `uk_user_id` (`user_id`);

-- 2. 确保 Match 表字段注释与领域模型对齐
ALTER TABLE `match_event` MODIFY COLUMN `status` VARCHAR(20) DEFAULT 'PREPARING' COMMENT '状态：PREPARING, PUBLISHED, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, SETTLED, CANCELLED';

-- 3. 确保 Tournament 和 Club 初始数据完整
-- 已经在 V12 中初始化，此处进行检查和兜底
INSERT IGNORE INTO `tournament` (id, name) VALUES (1, '每周杯');
INSERT IGNORE INTO `club` (id, tournament_id, name) VALUES (1, 1, '老男孩俱乐部');
