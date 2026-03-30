-- V19__tournament_soft_delete.sql
-- 为 Tournament 表增加软删除字段，支持回收站功能

ALTER TABLE `tournament`
    ADD COLUMN `deleted_at` DATETIME DEFAULT NULL COMMENT '软删除时间',
    ADD COLUMN `deleted_by` BIGINT DEFAULT NULL COMMENT '删除操作人用户ID';
