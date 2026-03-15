-- 为用户表增加角色字段
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(20) DEFAULT 'player' COMMENT '角色：admin-管理员，player-普通球员' AFTER `status`;
