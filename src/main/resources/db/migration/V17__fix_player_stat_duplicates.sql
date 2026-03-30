-- V17__fix_player_stat_duplicates.sql
-- 修复 player_stat 表中的重复记录问题
-- 
-- 问题背景：
-- V14 将 player_stat 的唯一约束从 (player_id) 改为 (player_id, tournament_id)
-- 但老代码 PlayerServiceImpl.save() 仍在插入 tournament_id=NULL 的记录
-- 导致同一个 player_id 同时存在 tournament_id=NULL 和 tournament_id=1 的记录
-- 在 RatingServiceImpl.updatePlayerStats() 中触发 TooManyResultsException
--
-- 修复方案：
-- 删除所有 tournament_id IS NULL 的记录
-- 保留有明确 tournament_id 的记录（这些记录是通过 TournamentPlayerService 正确创建的）

-- 删除 tournament_id 为 NULL 的 player_stat 记录
DELETE FROM `player_stat` WHERE `tournament_id` IS NULL;

-- 验证修复结果（该查询应返回 0 行）
-- SELECT player_id, COUNT(*) as cnt 
-- FROM player_stat 
-- GROUP BY player_id, tournament_id 
-- HAVING cnt > 1;
