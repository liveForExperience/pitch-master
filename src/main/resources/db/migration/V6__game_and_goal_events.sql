-- 具体比赛场次表
CREATE TABLE `match_game` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `match_id` BIGINT NOT NULL COMMENT '所属大赛事ID',
    `team_a_index` INT NOT NULL COMMENT 'A队序号',
    `team_b_index` INT NOT NULL COMMENT 'B队序号',
    `start_time` DATETIME DEFAULT NULL COMMENT '比赛实际开始时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '预定结束时间',
    `overtime_minutes` INT DEFAULT 0 COMMENT '加时分钟数',
    `score_a` INT DEFAULT 0 COMMENT 'A队比分',
    `score_b` INT DEFAULT 0 COMMENT 'B队比分',
    `status` VARCHAR(20) DEFAULT 'READY' COMMENT '状态：READY, PLAYING, FINISHED',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 进球记录表
CREATE TABLE `match_goal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `game_id` BIGINT NOT NULL COMMENT '场次ID',
    `team_index` INT NOT NULL COMMENT '进球方球队序号',
    `scorer_id` BIGINT DEFAULT NULL COMMENT '进球球员ID (NULL表示未知)',
    `assistant_id` BIGINT DEFAULT NULL COMMENT '助攻球员ID',
    `type` VARCHAR(20) DEFAULT 'NORMAL' COMMENT '类型：NORMAL-普通, OWN_GOAL-乌龙',
    `occurred_at` DATETIME NOT NULL COMMENT '进球发生时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
