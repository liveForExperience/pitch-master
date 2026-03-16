# PitchMaster 项目待办事项 (TODO)

## 1. 评分系统 (Rating System - CPI)
- 已完成基础功能: FM 风格 1-20 总分制、三维评分 (Skill/Performance/Engagement)、衰减机制、管理员修正

## 2. 球员档案 (Player Archive - FM Style)
- [ ] **能力面板设计**: 数据库增加五维数据字段。
- [ ] **自动身价模型**: 开发基于 CPI、胜率、年龄的虚拟“身价”。
- [ ] **战绩中心**: 球员详情页增加历史统计。

## 3. 核心业务与 SSE
- [ ] **SSE 事件扩展**: 满员通知、赛事取消推送。
- [ ] **费用管理**: 自动平摊与管理员豁免逻辑。

## 4. 架构与前端
- [ ] **多租户拦截器**: 实现 tournament_id 自动过滤。
- [ ] **前端海报增强**: MatchPoster.tsx 展示 CPI。