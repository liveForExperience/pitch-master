-- V9: 为 match 表新增赛制类型字段，预留未来赛制扩展点
-- 当前仅支持 LEAGUE（联赛积分制）作为默认值

ALTER TABLE `match`
    ADD COLUMN `game_format` VARCHAR(50) NOT NULL DEFAULT 'LEAGUE'
        COMMENT '赛制类型: LEAGUE=联赛积分制';
