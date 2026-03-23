# GEMINI.md - AI Agent 项目上下文

> 本文件为 AI Agent 开发辅助提供项目上下文，不属于正式技术文档。正式文档请查阅 `docs/` 目录。

## 0. 全局 AI 规则

- **开发与修复工作流**: 对于任何需求开发、Bug修复或者是版本上线，必须严格强制调用并遵循 `cade-dev-workflow` 全生命周期开发工作流技能的规则来执行。
    - 如何搜索skill：cd /Users/chenyue/.gemini/antigravity/global_skills，然后使用find命令搜索

## 1. 项目定义

- **项目名称**: PitchMaster
- **核心目标**: 业余足球爱好者的赛事与俱乐部管理平台
- **当前阶段**: 核心功能已上线，包括赛事管理、分组算法、实时比分、FM 风格评分系统

## 2. 技术栈

**Backend**
- Spring Boot 3.4 + MyBatis-Plus + MySQL
- Apache Shiro (认证授权，ROLE: ADMIN/USER)
- Flyway (数据库版本管理)
- SSE (实时推送)
- JUnit 5 + Mockito (测试)

**Frontend**
- React 18 + TypeScript + Vite
- Ant Design Mobile + Tailwind CSS (主色 `#1DB954`)
- Zustand (状态管理)
- ECharts (评分雷达图)
- Axios (`withCredentials: true` 对应 Shiro Session)

## 3. 关键业务规则摘要

**费用逻辑**
- `cancelDeadline` 后取消报名仍需分摊费用
- `isExempt` 豁免标记，剩余费用由非豁免人员向上取整 (`Math.ceil`) 平摊
- `NO_SHOW` 状态人员仍需参与分摊

**评分系统 (FM 风格 1-20 分)**
- 三维评分: Skill / Performance / Engagement
- 公式: `Total = Skill × 0.40 + Performance × 0.40 + Engagement × 0.20`
- 新球员展期保护 (前 3 场)，初始分 5.0（管理员可指定）
- 衰减: 30 天不活跃后每周 Engagement -0.10，下限 1.00
- 详细规则见 `docs/RATING_SYSTEM.md`

**分组算法**
- 策略模式设计 (`GroupingStrategy` 接口)
- 当前实现: 基于 Rating 的蛇形分组 (Snake Draft)
- 扩展预留: 位置权重、默契度、配合意愿

**实时架构**
- SSE 订阅模式: `GET /api/realtime/subscribe/{matchId}`
- `SseManager` 维护基于 `matchId` 的连接池
- 比分变动写入 `match_score_log` 后进行广播

## 4. 编码要求

- 遵循《阿里巴巴 Java 开发手册》规约
- Controller 只做编排，业务逻辑沉淠在 Service
- Migration 优先于实体修改
- 所有 `TODO` 记录在根目录 `TODO.md`
- UI 遵循现有 Tailwind CSS 布局方案
- 每个功能模块必须配有单元测试 (JUnit 5 + Mockito)

## 5. 待完成功能 (Roadmap)

详见 `TODO.md`。
