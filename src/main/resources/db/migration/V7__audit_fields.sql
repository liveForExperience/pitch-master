-- 为场次表增加修改人记录
ALTER TABLE `match_game` ADD COLUMN `updated_by` BIGINT COMMENT '最后修改比分的人员ID' AFTER `status`;

-- 为进球记录表增加录入人和修改人记录
ALTER TABLE `match_goal` ADD COLUMN `created_by` BIGINT COMMENT '录入人人员ID' AFTER `occurred_at`;
ALTER TABLE `match_goal` ADD COLUMN `updated_by` BIGINT COMMENT '最后修改人人员ID' AFTER `created_by`;
