-- 为场次表增加锁定机制字段
ALTER TABLE `match_game` ADD COLUMN `lock_user_id` BIGINT COMMENT '当前锁定此场次进行编辑的用户ID' AFTER `updated_by`;
ALTER TABLE `match_game` ADD COLUMN `lock_time` DATETIME COMMENT '锁定开始时间' AFTER `lock_user_id`;
