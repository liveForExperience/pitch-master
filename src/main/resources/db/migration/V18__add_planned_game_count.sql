-- V18: 增加计划场次数量属性
ALTER TABLE `match_event` 
ADD COLUMN `planned_game_count` INT DEFAULT 3 COMMENT '计划场次数量' AFTER `players_per_group`;
