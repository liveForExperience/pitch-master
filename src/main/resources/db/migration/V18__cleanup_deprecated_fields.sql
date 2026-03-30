-- V18__cleanup_deprecated_fields.sql
-- 清理设计迭代遗留的废弃字段与冗余表
--
-- 变更说明：
-- 1. player 表：删除已迁移至 tournament_player / player_rating_profile 的废弃字段
-- 2. tournament_player 表：删除从未被 RatingService 更新的冗余 rating 字段
-- 3. player_attribute 表：整体删除（功能未完成，无读取 API，未来重新设计）
-- 4. player_relationship 表：整体删除（无任何业务逻辑引用）
-- 5. player_stat 表：删除始终为空的 recent_form 字段

-- 1. 清理 player 表废弃字段
--    这些字段在 V14 引入 tournament_player 后已标注废弃
--    player 表回归纯粹的「全局球员档案」角色
ALTER TABLE `player`
    DROP COLUMN `tournament_id`,
    DROP COLUMN `real_club_id`,
    DROP COLUMN `rating`,
    DROP COLUMN `rating_version`,
    DROP COLUMN `last_match_time`,
    DROP COLUMN `last_attendance_time`;

-- 2. 清理 tournament_player 表冗余 rating 字段
--    评分数据统一由 player_rating_profile 承载（含三维 + 版本号）
ALTER TABLE `tournament_player`
    DROP COLUMN `rating`,
    DROP COLUMN `rating_version`;

-- 3. 删除 player_attribute 表
--    该表在 V2 建立，RatingService 有写入但无任何读取 API
--    保留现有 FM 属性设计思路，待后续功能规划时重新实现
DROP TABLE IF EXISTS `player_attribute`;

-- 4. 删除 player_relationship 表
--    该表在 V2 建立，从未被任何业务逻辑引用
DROP TABLE IF EXISTS `player_relationship`;

-- 5. 删除 player_stat.recent_form 字段
--    该字段始终为空，无任何更新逻辑
ALTER TABLE `player_stat`
    DROP COLUMN `recent_form`;
