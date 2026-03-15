-- V4__initial_admin_data.sql

-- 1. 初始化一个默认赛事 (租户)
INSERT INTO `tournament` (`id`, `name`, `description`, `status`) 
VALUES (1, '老男孩俱乐部公开赛', '默认基础赛事', 1);

-- 2. 初始化一个默认俱乐部 (组织)
INSERT INTO `club` (`id`, `tournament_id`, `name`, `description`) 
VALUES (1, 1, '自由人联队', '系统预设默认俱乐部');

-- 3. 初始化超级管理员账号 (admin/admin)
-- 密码哈希说明: SHA-256("admin_salt" + "admin") = e8054c3e4fb91c8476925fd48134ebbf38ee437e72f752ae0d3dcc465dd4f252
INSERT INTO `user` (`id`, `username`, `password`, `salt`, `real_name`, `status`) 
VALUES (1, 'admin', 'e8054c3e4fb91c8476925fd48134ebbf38ee437e72f752ae0d3dcc465dd4f252', 'admin_salt', '系统管理员', 1);

-- 4. 关联角色 (admin 既是管理员又是球员)
-- 注意: role_id 已经在 V1 中定义 (1:admin, 2:player)
INSERT INTO `user_role` (`user_id`, `role_id`) VALUES (1, 1);
INSERT INTO `user_role` (`user_id`, `role_id`) VALUES (1, 2);

-- 5. 初始化球员档案 (使 admin 拥有球员身份，方便测试报名等流程)
INSERT INTO `player` (`id`, `user_id`, `tournament_id`, `real_club_id`, `nickname`, `position`, `rating`, `age`, `preferred_foot`, `status`)
VALUES (1, 1, 1, 1, '老大哥', 'MF', 8.50, 35, 'BOTH', 1);
