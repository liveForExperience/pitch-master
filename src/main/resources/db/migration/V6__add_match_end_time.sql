-- V6__add_match_end_time.sql
-- Add missing columns to match table

ALTER TABLE `match`
    ADD COLUMN `end_time` DATETIME DEFAULT NULL COMMENT '比赛结束时间' AFTER `start_time`,
    ADD COLUMN `duration_per_game` INT DEFAULT NULL COMMENT '每场游戏时长（分钟）' AFTER `planned_game_count`;
