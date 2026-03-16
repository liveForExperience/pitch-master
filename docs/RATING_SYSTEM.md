# PitchMaster 评分系统 (CPI) 设计规范

## 1. 核心定义
**综合战力指数 (CPI)**：采用 FM 风格 1-20 分制的多维权重评分系统。

### 评分维度
- **总评分 (Total Rating)**: 1.00-20.00，综合三维加权结果
- **Skill Rating**: 长期技术能力，基于表现平滑更新
- **Performance Rating**: 单场结果与数据表现（进球、助攻、MVP、胜负）
- **Engagement Rating**: 活跃度、互评参与度、连续出勤

### 权重配置
```
Total = Skill × 0.40 + Performance × 0.40 + Engagement × 0.20
```

## 2. 核心机制

### 2.1 新球员保护机制
- 初始评分: 5.00 (可由管理员指定)
- 前 3 场比赛享受 0.60 保护系数，变动幅度减小

### 2.2 Skill 计算
- 基于单场评分、进球、助攻、MVP 综合计算目标值
- 采用 0.15 平滑系数逐步趋近
- 受新手保护影响

### 2.3 Performance 计算
- 胜利 +0.25，平局 +0.05，失败 -0.15
- 进球 +0.06/个（最多3个），助攻 +0.05/个（最多3个）
- MVP +0.10，单场评分调整 ±0.04
- 单次最大变动 ±0.60，受新手保护影响

### 2.4 Engagement 计算
- 每次出勤 +0.03
- 提交互评 +0.02
- 连续活跃周数奖励（最多5周 × 0.01）
- 超过30天不活跃后重返 +0.05 回归奖励

### 2.5 衰减机制
- 触发条件: 最后出勤时间超过 30 天
- 衰减频率: 每周执行一次
- 衰减幅度: Engagement -0.10/周
- 下限保护: 所有评分不低于 1.00

## 3. 数据模型

### player_rating_profile (评分档案表)
```sql
skill_rating DECIMAL(4,2)           -- Skill 评分
performance_rating DECIMAL(4,2)     -- Performance 评分
engagement_rating DECIMAL(4,2)      -- Engagement 评分
provisional_matches INT             -- 已参加场次（用于保护期判断）
appearance_count INT                -- 总出勤次数
active_streak_weeks INT             -- 连续活跃周数
last_attendance_time DATETIME       -- 最后出勤时间
last_decay_time DATETIME            -- 最后衰减时间
```

### player_rating_history (审计表)
```sql
dimension VARCHAR(20)               -- SKILL/PERFORMANCE/ENGAGEMENT/TOTAL/DECAY
source_type VARCHAR(30)             -- MATCH_SETTLEMENT/INACTIVITY_DECAY/ADMIN_CORRECTION
old_value/new_value DECIMAL(10,2)   -- 变动前后值
delta DECIMAL(10,2)                 -- 变动增量
reason_code VARCHAR(50)             -- 变动原因代码
reason_detail VARCHAR(255)          -- 变动详情
operator_user_id BIGINT             -- 操作人（管理员修正时）
```

## 4. 管理员功能
- 手动修正总评分: `/api/admin/player/{id}/rating/total`
- 手动修正三维评分: `/api/admin/player/{id}/rating/dimension`
- 所有修正操作记录完整审计日志