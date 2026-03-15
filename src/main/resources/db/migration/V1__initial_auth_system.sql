-- V1__initial_auth_system.sql
-- 1. 用户表
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username` VARCHAR(64) NOT NULL COMMENT '用户名',
    `password` VARCHAR(128) NOT NULL COMMENT '密码',
    `salt` VARCHAR(64) NOT NULL COMMENT '盐值',
    `real_name` VARCHAR(64) DEFAULT NULL COMMENT '真实姓名',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户账号表';

-- 2. 角色表
CREATE TABLE `role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称：admin, player, coach 等',
    `description` VARCHAR(100) COMMENT '角色描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统角色表';

-- 3. 用户-角色关联表
CREATE TABLE `user_role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户角色关联表';

-- 4. 系统配置状态表 (如评分衰减最后运行时间)
CREATE TABLE `system_status` (
    `config_key` VARCHAR(64) PRIMARY KEY,
    `config_value` VARCHAR(255),
    `description` VARCHAR(255),
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统配置与状态快照';

-- 初始化数据
INSERT INTO `role` (`name`, `description`) VALUES ('admin', '系统管理员');
INSERT INTO `role` (`name`, `description`) VALUES ('player', '球员');
INSERT INTO `system_status` (`config_key`, `config_value`, `description`) VALUES ('LAST_DECAY_RUN_TIME', '2026-01-01 00:00:00', '球员评分衰减任务最后执行时间');
