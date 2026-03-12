-- 为赛事表增加每组人数限制字段
ALTER TABLE `match_event` ADD COLUMN `players_per_group` INT DEFAULT 5 COMMENT '每组标准人数（用于检查开赛条件）' AFTER `num_groups`;
