# PitchMaster 项目待办事项 (TODO)

本文件记录所有待实现的功能、待修复的 Bug 以及架构优化项。任务完成后请及时移除。

## 1. 核心业务功能 (Core Features)
- [ ] **评分系统：零封奖励 (Clean Sheet)**: `RatingServiceImpl` 需增加对门将 (GK) 在零封场次下的额外奖励评分（建议 +0.05）。
- [ ] **评分系统：动态策略切换**: 目前 `RatingStrategy` 为全局单一实现。需支持在 `Tournament` 或 `Match` 维度动态选择不同的评分策略（如 Elo, Glicko-2 等）。
- [ ] **SSE 事件扩展**:
    - [ ] **满员通知**: 当报名人数达到 `numGroups * playersPerGroup` 时，推送 `match_full` 事件。
    - [ ] **赛事取消**: 赛事状态变更为 `CANCELLED` 时，推送 `match_cancelled` 事件。
- [ ] **费用自动更新**: 当管理员修改 `totalCost` 或标记 `isExempt` 时，若处于 `SETTLED` 状态，应自动重新计算 `perPersonCost` 并同步。

## 2. 架构与优化 (Architecture & Optimization)
- [ ] **评分衰减任务 (Rating Decay)**: 确保 `RatingDecayTask` 正确读取 `SYSTEM_STATUS` 中的配置，并对长期不活跃球员执行评分衰减逻辑。
- [ ] **多租户拦截器**: 在 MyBatis-Plus 层实现真正的多租户拦截器，自动在所有 SQL 中注入 `tournament_id` 过滤。
- [ ] **前端海报增强**: 在 `MatchPoster.tsx` 中增加更多维度的赛事统计数据展示（如历史对阵纪录、平均战力等）。

## 3. 测试与质量 (Testing & Quality)
- [ ] **集成测试**: 编写完整的赛事生命周期集成测试，涵盖从发布、报名、截止、分组、开赛到结算的全流程。
- [ ] **并发测试**: 针对 `MatchGame` 的比分锁定机制进行并发修改测试。

---
*最后更新时间: 2026-03-15*
