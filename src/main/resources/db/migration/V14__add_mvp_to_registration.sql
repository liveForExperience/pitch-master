-- V14: 在报名表中增加 MVP 荣誉字段
ALTER TABLE `match_registration` 
ADD COLUMN `is_mvp` TINYINT(1) DEFAULT 0 COMMENT '是否为本场最佳球员(MVP)';

-- 增加索引方便统计球员生涯 MVP 次数
CREATE INDEX `idx_reg_is_mvp` ON `match_registration` (`is_mvp`);
