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

---

## ADR-0005 · 战报扩展为"单场 + 活动"两层，含三榜，与 UI 同源

**日期**：2026-06-18
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

原 ARCH §7 战报仅设计了"单场"模板，且与应用 UI 没有共享设计令牌。
需求方提出战报必须：
1. 风格"简洁明快"且与项目 UI/UX 同源
2. 内容至少包括：积分榜、射手榜、助攻榜

经线框 demo 评审，做出以下决策。

### 决策

1. **两层战报并存**：
   - 单场战报：一场结束后即可分享，含比分、进球流水、单场 MVP
   - 活动战报：含场次结果列表、积分榜、射手榜、助攻榜、活动 MVP
2. **视觉风格**：卡片浅底长图（风格 B），与 §8 UI 设计系统**严格同源**——使用同一套 `tokens.ts` 派生颜色/字号/间距，App / H5 / PNG 海报三处视觉一致
3. **积分规则**：标准足球 3-1-0；同分按 净胜球 → 进球数 → 队名 排序
4. **球员标识**：仅名字 + 所在队伍（与零账号体系一致）
5. **Top N**：可配置，admin 在分享时选（默认 5，范围 1-20）
6. **H5 加成**：战报页面头部固定 CTA 跳转到活动主页（促进复访）

### 后果

**正面**：
- 设计令牌单点维护，杜绝"App 与海报色板不一致"漂移
- 满足"现场快速分享 + 活动后总结"双场景
- 标准积分规则用户认知零成本

**负面**：
- 战报 satori 模板需与 React 组件保持结构同源，开发上需注意（用 React 写 + satori 兼容子集）
- 长图海报高度需动态估算，对边缘场景（队伍极多）要兜底测试

### 关联文档

- `docs/ARCHITECTURE_V2.md` §7（战报渲染整章）+ §8.3（设计系统）+ §4.2（API 表新增 game/event 两套 report/poster 端点）
- `DEVELOPMENT_PLAN.md` §2.3 T2.4-T2.7（Phase 2 任务）

---

---

## ADR-0006 · v1 运行时立即彻底下线 + MySQL 全量归档

**日期**：2026-06-18
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

v1 代码已归档至 `legacy/`（ADR-0001），但**运行时**仍残留在 ECS：
- systemd `pitchmaster.service`（Spring Boot jar，监听 :8080）
- Nginx site（监听 :80）
- MySQL Server（监听 :3306，含 `pitch_master` 数据库）
- OpenJDK + Maven 本体（占磁盘 + 内存）

v2 选型为 Node + SQLite，根本不需要 MySQL；同台 ECS 资源（1C/1G）需要给 v2 让位。

### 决策

| 维度 | 选择 |
|---|---|
| 现网在用？ | 无人在用，可随时下线 |
| 数据处置 | `mysqldump` 全量导出（含路由/触发器）→ gzip → 归档进仓库 `legacy/db-dump/` |
| 下线深度 | 方案 A：彻底下线 + 卸载 MySQL/Java/Maven |
| 执行时机 | Phase 0 立即执行（避免数据丢失风险） |
| 部署位置 | v2 复用同一台 ECS |
| Nginx 处置 | 仅删 v1 site conf，保留 Nginx 本体；Phase 3 部署 v2 时再决定是保留 Nginx 还是换 Caddy |

### 实施约束

- `pitchmaster.env` 含 DB 明文密码，备份后 **禁止 commit 公共仓库**（通过 `legacy/db-dump/.gitignore` 排除）
- dump 文件大小 ≥ 10MB 时改用 git-lfs；≥ 50MB 时落本地不进仓库
- 脚本 `deploy/scripts/legacy-shutdown.sh` 支持 `--dump-only` 模式以便先备份后下线
- 手动 SOP `docs/LEGACY_SHUTDOWN.md` 作为脚本失败时的兜底

### 后果

**正面**：
- 端口 8080 / 3306 释放给 v2 调试
- JVM + MySQL 约 600-800MB 常驻内存释放（1G ECS 上至关重要）
- 磁盘释放 ≥ 1GB
- 历史数据有快照可考古

**负面**：
- 一旦执行不可逆；如发现 dump 不完整需要在执行前用 `--dump-only` 反复验证
- 未来若想"看一眼某场比赛历史数据"需要从 dump 恢复到一个新 MySQL 实例

### 关联文档

- `deploy/scripts/legacy-shutdown.sh` · 半自动下线脚本
- `docs/LEGACY_SHUTDOWN.md` · 手把手 SOP（含恢复演练）
- `DEVELOPMENT_PLAN.md` Phase 0 T0.6 + Gate

---

> 后续 ADR 在此追加，编号递增。
