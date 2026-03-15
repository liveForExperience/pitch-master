-- 1. 创建角色表
CREATE TABLE `role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称：admin, player, coach 等',
    `description` VARCHAR(100) COMMENT '角色描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 创建用户-角色关联表
CREATE TABLE `user_role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 插入初始化角色
INSERT INTO `role` (`name`, `description`) VALUES ('admin', '系统管理员');
INSERT INTO `role` (`name`, `description`) VALUES ('player', '球员');

-- 4. 数据迁移：将原 user 表中的角色信息迁移到关联表
-- 注意：这里假设原来的 role 字段存储的是单值或逗号分隔的值，
-- 下面的 SQL 仅处理单值情况，复合值需要手动处理或使用存储过程。
-- 这里的逻辑是：如果 user.role 是 'admin'，则插入 admin 关联；如果是 'player'，则插入 player 关联。
INSERT INTO `user_role` (user_id, role_id)
SELECT u.id, r.id FROM `user` u CROSS JOIN `role` r 
WHERE (u.role = r.name) OR (u.role LIKE CONCAT('%', r.name, '%'));

-- 5. (可选) 删除原 user 表中的 role 字段，或者保留用于向后兼容
-- ALTER TABLE `user` DROP COLUMN `role`;
