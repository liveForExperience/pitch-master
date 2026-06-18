-- 添加结算模块相关字段
ALTER TABLE `match` ADD COLUMN `settlement_published` TINYINT(1) DEFAULT 0 COMMENT '结算信息是否已确认发布';

ALTER TABLE `match_registration` ADD COLUMN `payment_amount` DECIMAL(10,2) DEFAULT NULL COMMENT '实际需支付金额';
