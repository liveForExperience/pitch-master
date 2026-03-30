-- V16__decouple_player_tournament_fk.sql
-- 解耦 player 表与 tournament 的强关联
-- 背景：V14 引入 tournament_player 表后，球员注册不再绑定 Tournament；
--       player.tournament_id 已废弃，需解除 NOT NULL 约束和外键，避免注册报错。

ALTER TABLE `player`
    DROP FOREIGN KEY `fk_player_tournament`,
    MODIFY COLUMN `tournament_id` BIGINT DEFAULT NULL COMMENT '已废弃字段，保留做历史数据参考，请勿引用';
