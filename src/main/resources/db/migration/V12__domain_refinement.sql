-- 1. 创建顶级租户：赛事 (Tournament)
CREATE TABLE `tournament` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '赛事名称',
    `config` TEXT COMMENT '规则配置 (JSON)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='赛事(租户)';

-- 初始化默认赛事
INSERT INTO `tournament` (id, name) VALUES (1, '每周杯');

-- 2. 创建组织层：俱乐部 (Club)
CREATE TABLE `club` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` BIGINT NOT NULL COMMENT '所属赛事ID',
    `name` VARCHAR(100) NOT NULL COMMENT '俱乐部名称',
    `logo` VARCHAR(255) COMMENT 'Logo路径',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_tournament_id` (`tournament_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='俱乐部';

-- 初始化默认俱乐部
INSERT INTO `club` (id, tournament_id, name) VALUES (1, 1, '老男孩俱乐部');

-- 3. 重构现有表，将旧的 club_id 迁移为 tournament_id
-- Player 表重构
ALTER TABLE `player` CHANGE COLUMN `club_id` `tournament_id` BIGINT DEFAULT 1 COMMENT '所属赛事ID';
ALTER TABLE `player` ADD COLUMN `real_club_id` BIGINT DEFAULT 1 COMMENT '所属俱乐部ID' AFTER `tournament_id`;

-- Match 表重构 (将其视为 Match)
ALTER TABLE `match_event` CHANGE COLUMN `club_id` `tournament_id` BIGINT DEFAULT 1 COMMENT '所属赛事ID';
-- 预留俱乐部报名支持
ALTER TABLE `match_event` ADD COLUMN `registration_type` VARCHAR(20) DEFAULT 'PLAYER' COMMENT '报名主体类型: PLAYER, CLUB';

-- 4. 创建场次参与者表现表 (Game Participant)
CREATE TABLE `game_participant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `game_id` BIGINT NOT NULL COMMENT '场次ID',
    `player_id` BIGINT NOT NULL COMMENT '球员ID',
    `goals` INT DEFAULT 0 COMMENT '进球数',
    `assists` INT DEFAULT 0 COMMENT '助攻数',
    `is_mvp` TINYINT(1) DEFAULT 0 COMMENT '是否MVP',
    `rating` DECIMAL(3,1) COMMENT '本场评分',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_game_player` (`game_id`, `player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场次参与者表现数据';
