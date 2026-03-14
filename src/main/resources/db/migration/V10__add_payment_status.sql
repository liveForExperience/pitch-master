-- 为报名表增加支付状态记录
ALTER TABLE `match_registration` ADD COLUMN `payment_status` VARCHAR(20) DEFAULT 'UNPAID' COMMENT '支付状态：UNPAID-未支付, PAID-已支付' AFTER `status`;
