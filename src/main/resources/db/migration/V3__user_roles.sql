-- 为用户表增加角色字段
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(20) DEFAULT 'USER' COMMENT '角色：ADMIN-管理员，USER-普通用户' AFTER `status`;

-- 初始化一个默认管理员 (密码: admin123, 盐: init_salt)
-- 实际加密结果: SHA-256("admin123" + "init_salt")
INSERT INTO `user` (username, password, salt, real_name, role, status) 
VALUES ('admin', '49bb41088714073a9876798a69d41d34c034298a87b76779836173059882250c', 'init_salt', '系统管理员', 'ADMIN', 1);
