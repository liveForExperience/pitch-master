-- V11: 赛事软删除与实际开赛时间
-- 功能：支持管理员设置实际开赛时间、赛事软删除及回收站

-- 1. 添加实际开赛时间字段（管理员触发开赛时设置，允许调整）
ALTER TABLE `match` ADD COLUMN `actual_start_time` DATETIME NULL COMMENT '实际开赛时间（管理员触发时设置）' AFTER `start_time`;

-- 2. 添加软删除相关字段
ALTER TABLE `match` ADD COLUMN `deleted_at` DATETIME NULL COMMENT '软删除时间' AFTER `updated_at`;
ALTER TABLE `match` ADD COLUMN `deleted_by` BIGINT NULL COMMENT '删除操作人用户ID' AFTER `deleted_at`;

-- 3. 添加索引以优化软删除查询
CREATE INDEX idx_deleted_at ON `match` (`deleted_at`);
CREATE INDEX idx_status_deleted ON `match` (`status`, `deleted_at`);

-- 4. 添加外键约束（软删除操作人）
ALTER TABLE `match` ADD CONSTRAINT `fk_match_deleted_by` 
    FOREIGN KEY (`deleted_by`) REFERENCES `user` (`id`) ON DELETE SET NULL;
