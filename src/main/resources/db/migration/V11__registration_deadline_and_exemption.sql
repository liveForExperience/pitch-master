-- 增加报名截止时间
ALTER TABLE match_event ADD COLUMN registration_deadline DATETIME DEFAULT NULL AFTER start_time;

-- 增加费用豁免标记
ALTER TABLE match_registration ADD COLUMN is_exempt BOOLEAN DEFAULT FALSE;

-- 更新 Match 状态枚举 (如果使用字符串存储，确保业务代码对齐)
-- 现有状态: SCHEDULED, ONGOING, FINISHED
-- 目标状态: PREPARING, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, SETTLED, CANCELLED
-- 为了平滑迁移，我们可以先在业务层对齐，或者直接更新旧数据
UPDATE match_event SET status = 'PREPARING' WHERE status = 'SCHEDULED';
UPDATE match_event SET status = 'MATCH_FINISHED' WHERE status = 'FINISHED';
