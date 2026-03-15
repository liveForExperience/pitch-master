-- V15: 增加球员最后参赛时间追踪，用于衰减算法
ALTER TABLE `player` 
ADD COLUMN `last_match_time` DATETIME DEFAULT NULL COMMENT '最后一次参加比赛的时间';

-- 初始化：将当前所有活跃球员的最后参赛时间设为当前时间，防止误触发大规模衰减
UPDATE `player` SET `last_match_time` = CURRENT_TIMESTAMP WHERE `status` = 1;
