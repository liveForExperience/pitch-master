# GEMINI.md - 项目开发规约与上下文

## 1. 项目背景 (Context)
- **项目名称**: PitchMaster (球场大师)
- **核心目标**: 构建一个业余足球爱好者管理平台，涵盖球赛管理、球队信息维护、球员录入、比赛分组自动分配以及赛后数据统计。
- **当前阶段**: 概念构思与基础架构搭建。

## 2. 技术栈 (Tech Stack)
- **核心框架**: Spring Boot (最新稳定版)
- **权限安全**: Apache Shiro
- **持久层**: MyBatis-Plus
- **数据库**: MySQL
- **前端框架**: React + TypeScript + Tailwind CSS + Ant Design Mobile (优先使用 Tailwind 进行布局与样式定制)
- **实时通信**: SSE (Server-Sent Events) 扩展为通用消息总线。
- **构建工具**: Maven / npm

## 3. 编码标准 (Engineering Standards)
- **待办管理**: 
  - 所有待实现的功能或发现的 Bug 均记录在根目录的 `TODO.md` 中。
  - 任务完成后，必须从 `TODO.md` 中移除相应条目。
- **UI 规范**: 遵循现有 Tailwind CSS 布局方案。
- **费用逻辑**: 
  - 引入 `registration_deadline` (报名截止时间)。
  - 截止后取消报名仍需分摊费用。
  - 管理员拥有“豁免权”：可手动标记特定球员无需支付，剩余费用由非豁免人员向上取整 (Math.ceil) 平摊。
- **质量保证**: 每个功能模块必须配有单元测试 (JUnit 5 + Mockito)。

## 5. 核心算法与组件 (Core Components)
- **分组算法 (Grouping Strategy)**: 
  - 优先考虑“位置偏好”而非硬性限制。
  - 引入“默契度与意愿”权重进行局部搜索优化。
- **打分系统 (Rating System)**:
  - 采用策略模式设计，支持动态切换评分规则。
  - 数据采集维度：进球、助攻、胜场、出勤率、零封(GK)。
- **实时总线 (Event Bus)**: 基于 SSE，支持比分、满员、赛事取消等多种事件分发。

## 6. 待讨论模块 (Roadmap)
- **Phase 1 (MVP)**:
  - Shiro 用户登录、权限控制。
  - 球员档案（含技术分、位置、年龄、擅长脚）。
  - 赛事发布与人均费用自动计算。
  - **基础分组算法**: 基于单一技术分实现实力平均分配。
- **Phase 2 (Algorithm Plus)**:
  - 引入位置互补权重。
  - 球员关系模型（配合意愿、历史默契度）。
  - 分组策略切换功能。
- **Phase 3 (Statistics & Growth)**:
  - 赛后多维度数据录入（进球、助攻、MVP）。
  - 个人能力图表自动更新。
