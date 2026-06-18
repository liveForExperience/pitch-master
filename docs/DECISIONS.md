# ADR · Architecture Decision Records

> 任何对 `DEVELOPMENT_PLAN.md §0 决策矩阵` 的变更必须在此追加 ADR 记录，注明日期、变更内容、原因、影响。
>
> 格式参考 [Michael Nygard ADR template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)。

---

## ADR-0001 · 推倒重做 v1，选择 Node + SQLite + PWA 路线

**日期**：2026-06-18
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

v1（Spring Boot + MySQL + React + AntD Mobile + FM 评分）在真实赛场使用时暴露：
- 无法快速记录"今天有多少球队、每队有谁"
- 无法快速记录每场对阵和最基本数据（进球/助攻）
- 无法显示比赛已进行时间
- 移动端操作复杂、UI/UX 不统一、对赛场单手操作不友好

技术债同时也极重：
- 多租户隔离形同虚设（越权风险）
- 测试覆盖近似零
- 评分系统 438 行复杂逻辑无任何保护
- 三套 AI 上下文文档相互不同步

### 决策

整体推倒重做。v1 完整归档至 `legacy/`。v2 选型：
- 后端：Node 20 + Hono + Drizzle + SQLite
- 前端：React 18 + Vite + Tailwind + Radix + Zustand + PWA
- 部署：systemd + Caddy（自动 HTTPS）

### 后果

**正面**：
- 部署成本砍掉 80%（无需 MySQL、JVM）
- 跨端类型复用（前后端共享 TS 类型）
- 离线能力天然（PWA + IndexedDB）
- 开发速度大幅提升（玩具项目最合适的栈）

**负面**：
- 放弃 v1 已有功能投入
- 玩具级安全设计不可在更大场景复用

---

## ADR-0002 · 单一 AGENTS.md 取代多 AI 上下文文件

**日期**：2026-06-18
**状态**：Accepted

### 背景

v1 同时存在 `GEMINI.md`、`.windsurfrules`、`docs/` 三套 AI 指引，互相不同步导致 AI 编码代理拿到的上下文不一致。

### 决策

合并为单一 `AGENTS.md`（业界 [agents.md](https://agents.md/) 共识做法），所有 AI 工具统一读取。
删除 `GEMINI.md`、`.windsurfrules`、`.windsurf/`。

### 后果

- 单点维护，杜绝漂移
- 所有 AI 工具（Cursor、Claude Code、Codex、Windsurf、Gemini）统一遵循

---

## ADR-0003 · v2 不做安全强化

**日期**：2026-06-18
**状态**：Accepted（仅在玩具场景有效）

### 背景

v2 目标用户为自己 + 朋友 1-2 个俱乐部 <50 人。

### 决策

不做：密码哈希强化、CSRF、限流、登录审计、复杂权限、SMS / 邮件验证。
PIN 明文入库；adminToken 明文存 localStorage。

### 后果

**正面**：实施成本极低，体验最优
**负面**：任何对外开放注册的扩展都需要先重做这一节；不能在生产环境承载真实付费用户

---

## ADR-0004 · Apple Watch 延后至 Phase 4

**日期**：2026-06-18
**状态**：Accepted

### 背景

需求方初期希望手表大按钮录入。但 watchOS 原生开发需 Swift 技术栈 + Apple Developer 账号 + 2-3 周学习曲线。

### 决策

Phase 1-3 仅做 PWA（手机端）。Phase 4 启动条件：手机端 MVP 上线 + 真实证伪手机端体验 + Apple Developer 资源到位。

后端 API 在设计时保持"Watch-friendly"：短载荷、原子操作、可重放，便于未来对接。

---

> 后续 ADR 在此追加，编号递增。
