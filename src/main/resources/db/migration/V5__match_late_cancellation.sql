-- 更新赛事表，增加取消报名的截止时间
ALTER TABLE `match_event` ADD COLUMN `cancel_deadline` DATETIME COMMENT '最晚取消报名时间' AFTER `start_time`;

-- 更新报名表，增加状态字段
ALTER TABLE `match_registration` ADD COLUMN `status` VARCHAR(20) DEFAULT 'REGISTERED' COMMENT '状态：REGISTERED-已报名, CANCELLED-已取消, NO_SHOW-缺席但需付费' AFTER `group_index`;
