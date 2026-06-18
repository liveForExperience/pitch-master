-- V10: 场次页面支持
-- 注：duration_per_game 已在 V6 中添加，此处仅补充 game_index

-- match_game 表新增场次序号，代表该场次在整个赛事中的顺序（从0开始）
-- 用途：scheduledStartTime = match.startTime + match.durationPerGame * game.gameIndex
ALTER TABLE `match_game`
    ADD COLUMN `game_index` INT NOT NULL DEFAULT 0
        COMMENT '场次在赛事中的顺序序号（从0开始），用于计算预计开始时间';
