# AGENTS.md · PitchMaster

> **唯一 AI 上下文文件**。任何 AI 编码代理（Cursor / Claude Code / Codex / Gemini / Copilot 等）在本仓库工作时**必须首先读完本文件**。
>
> 修改本文件需同步评估对 [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) 和 [`docs/ARCHITECTURE_V2.md`](./docs/ARCHITECTURE_V2.md) 的影响。

---

## 1. 项目一句话

**PitchMaster** 是给业余足球小圈子用的"现场实战记录器"——单人手机操作、零认知负担、断网可用、活动结束自动出战报。

---

## 2. 技术栈速查

| 层 | 选型 |
|---|---|
| 后端 | Node 20 + TypeScript + **Hono** + **Drizzle ORM** + **SQLite** (better-sqlite3, WAL) |
| 测试 | vitest + better-sqlite3 in-memory |
| 海报 | satori + @resvg/resvg-js (服务端 SVG→PNG) |
| 前端 | React 18 + Vite + TypeScript + **Tailwind** + **Radix UI** + **Zustand** + vite-plugin-pwa |
| 离线 | IndexedDB outbox + 联网后 replay |
| 实时 | SSE (Server-Sent Events) |
| 部署 | systemd + Caddy（auto HTTPS） |

详细架构参考 `docs/ARCHITECTURE_V2.md`。

---

## 3. 仓库结构（精简版，全量见 ARCHITECTURE_V2 §2）

```
/
├── AGENTS.md                  # 本文件
├── DEVELOPMENT_PLAN.md        # 阶段计划 + 验收门禁
├── README.md                  # 给真人看的入门
├── docs/
│   ├── ARCHITECTURE_V2.md     # 技术参考唯一真源
│   └── DECISIONS.md           # ADR 记录
├── backend/                   # Node + Hono 后端
├── web/                       # React + Vite + PWA 前端
└── deploy/                    # 部署脚本
```

---

## 4. AI 必须遵守的工作规则

### 4.1 决策前置

- **任何新增功能 / 数据模型变更前**：先读 `DEVELOPMENT_PLAN.md §1.2 In-Scope` 与 `§1.3 Out-of-Scope`。
- 若需求落在 Out-of-Scope，**先质疑需求方**，不要自作主张实现。
- 任何 API、DDL、目录约定的"新加项"或"变更项"，**先在 `docs/ARCHITECTURE_V2.md` 对应章节登记，再写代码**。

### 4.2 范围纪律（极其重要）

> 产品范围膨胀是最大风险。任何下列冲动 = 红线，需要打回：
>
> - "顺便加个用户登录吧"
> - "顺便给球员加个评分吧"
> - "顺便接个微信小程序吧"
> - "顺便把权限做得更严吧"
>
> 这些都需要明确写入 `DEVELOPMENT_PLAN.md §1.4 Should-Have` 并由需求方签署后方可启动。

### 4.3 北极星指标

实施每一个改动前，自问两条：
1. 这会不会让"开页面 → 记一个进球"超过 8 秒？
2. 这会不会让"活动结束 → 出战报"超过 3 秒？

任一答 yes，回炉重设计。

### 4.4 代码规范

- TypeScript strict mode 全开
- 后端：service 层不直接依赖 hono 上下文；route 仅做参数解析 + service 调用 + 响应包装
- 前端：组件 ≤ 250 行；超出强制拆分
- 不写"narrating 注释"（如 `// 调用接口`）；只写"why"或"非显然约束"
- 命名：实体单数（`event`, `game`, `roster`），路由复数（`/events`, `/games`）
- 时间：DB 与 API 一律 epoch ms (UTC)；只在 UI 层做时区转换

### 4.5 测试纪律（强约束）

后端核心 service 必须保持 ≥ 60% 行覆盖。如下改动**禁止合并**：
- `game.service.ts` 的 `deriveScore()` 改动而没有相应测试用例
- `timer.service.ts` 的状态机变更而没有覆盖 start/pause/resume/finish
- `outbox.service.ts` 的批量写入逻辑变更而没有幂等测试

执行：`cd backend && npm test`，目标行覆盖率不低于 60%（vitest --coverage）。

### 4.6 提交规范

- conventional-commit 风格：`feat:` `fix:` `chore:` `docs:` `refactor:` `test:`
- 一条 commit 一个主题
- 涉及 schema/API 变更，commit message 内附变更原因 + 影响范围

### 4.7 阶段日志

每个 Phase 内的 commit 推动后，更新 `DEVELOPMENT_PLAN.md §5 阶段实施日志`：完成项 ✔、未完成 ✘、遇到的困难、计划变更。

---

## 5. 关键业务规则速查

| 规则 | 内容 |
|---|---|
| 权威时间 | 服务端 `Date.now()` 是唯一真源；客户端通过 `GET /api/time` 校准 offset |
| 比分派生 | 不存储比分；从 `game_event` 流派生（见 ARCH §9.2） |
| 撤销 | 写入 `type=UNDO` + `undoTargetEventId`；不物理删除 |
| 幂等 | 所有事件写入携带 `clientEventId` (UUID)；DB unique 约束 `(game_id, client_event_id)` |
| 鉴权 | 写接口需 `Authorization: Bearer <adminToken>` 或 `?pin=XXXXXX` |
| 单管理员假设 | Phase 1–4：单设备录入；**Phase 5A** 租约单写者；**Phase 5B** 进球多写者、计时单写者 |
| MVP 选取 | 进球+助攻最高者；并列取较早出现 |

---

## 6. 常用命令

```bash
# 后端
cd backend
npm run dev              # 开发模式 (tsx watch)
npm test                 # vitest
npm test -- --coverage   # 带覆盖率
npm run build            # 编译到 dist/
npm run db:gen           # drizzle-kit generate
npm run db:migrate       # 应用迁移

# 前端
cd web
npm run dev              # vite dev
npm run build            # vite build
npm run preview          # 预览构建产物

# 部署（服务器上）
sudo bash deploy/scripts/install.sh    # 全新安装
sudo bash deploy/scripts/upgrade.sh    # 拉新代码 + 重启
sudo bash deploy/scripts/backup.sh     # 立即备份
```

---

## 7. 协作工作流

1. 任何需求/bug，先在 `DEVELOPMENT_PLAN.md §4 待决事项` 或 issue tracker 登记
2. 实施前对照 §4.1-4.3 自检
3. 写代码：小步提交、conventional-commits
4. 写/改测试，本地 `npm test` 通过
5. 完成后更新 PLAN §5 阶段日志
6. 涉及 ARCH 变更同步更新 `docs/ARCHITECTURE_V2.md` 对应章节

---

## 8. 红线清单（违反即 reject）

- ❌ 引入"任何形式的 FM 评分 / 三维评分 / 互评"
- ❌ 引入"用户注册系统"
- ❌ 引入"多租户拦截器 / Tournament / Club"
- ❌ 引入 MySQL / PostgreSQL（锁定 SQLite）
- ❌ 引入 Spring Boot / Java
- ❌ 写新功能不写测试 + 修改 `deriveScore` 不写测试
- ❌ 海报 / 战报渲染搞客户端 html2canvas（全部走 satori）
- ❌ 在 Routes 里写业务逻辑（Routes 只编排，业务在 Services）
- ❌ 在前端写"乐观更新但不入 outbox"的逻辑（任何写操作必须先 outbox）

---

## 9. 给特定 AI 工具的额外说明

### Cursor / Claude Code / Codex CLI
- 工作目录认 repo root
- 终端命令优先 `pnpm` 若已配置；否则 `npm`

---

## 10. 文档同步责任

| 文档 | 何时更新 |
|---|---|
| `AGENTS.md`（本文件） | 工作流、技术栈、红线变更 |
| `DEVELOPMENT_PLAN.md` | 决策变更、阶段进展、风险、待决项 |
| `docs/ARCHITECTURE_V2.md` | 任何 DDL / API / 算法 / 目录约定变更 |
| `docs/DECISIONS.md` | 决策矩阵变更需追加 ADR 记录 |
| `README.md` | 用户视角的快速上手或部署步骤变更 |
