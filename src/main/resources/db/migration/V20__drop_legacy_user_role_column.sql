-- V20: 删除 User 表中冗余的 role 字段，强制使用 user_role 关联表
ALTER TABLE `user` DROP COLUMN `role`;
