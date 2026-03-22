-- V7: 给 match 表增加 groups_published 字段
-- 用于区分分组草稿（仅管理员可见）和已发布分组（所有人可见）
ALTER TABLE `match`
    ADD COLUMN `groups_published` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '分组是否已发布：0=草稿（仅管理员可见），1=已发布（所有人可见）';
