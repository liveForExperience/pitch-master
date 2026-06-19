# ADR · Architecture Decision Records

> 任何对 `DEVELOPMENT_PLAN.md §0 决策矩阵` 的变更必须在此追加 ADR 记录，注明日期、变更内容、原因、影响。
>
> 格式参考 [Michael Nygard ADR template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)。

---

## ADR-0001 · 选择 Node + SQLite + PWA 路线

**日期**：2026-06-18
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

业余足球现场记录场景需要：快速建队、记进球/助攻、显示比赛时间、移动端单手操作。复杂的企业级功能（多租户、评分系统、用户注册）与这一场景不匹配。

### 决策

选型：
- 后端：Node 20 + Hono + Drizzle + SQLite
- 前端：React 18 + Vite + Tailwind + Radix + Zustand + PWA
- 部署：systemd + Caddy（自动 HTTPS）

### 后果

**正面**：
- 部署成本低（无需 MySQL、JVM）
- 跨端类型复用（前后端共享 TS 类型）
- 离线能力天然（PWA + IndexedDB）
- 开发速度快（玩具项目最合适的栈）

**负面**：
- 玩具级安全设计不可在更大场景复用

---

## ADR-0002 · 单一 AGENTS.md 取代多 AI 上下文文件

**日期**：2026-06-18
**状态**：Accepted

### 背景

项目启动前存在多套 AI 指引文档，互相不同步导致 AI 编码代理拿到的上下文不一致。

### 决策

合并为单一 `AGENTS.md`（业界 [agents.md](https://agents.md/) 共识做法），所有 AI 工具统一读取。
删除 `GEMINI.md`、`.windsurfrules`、`.windsurf/`。

### 后果

- 单点维护，杜绝漂移
- 所有 AI 工具（Cursor、Claude Code、Codex、Windsurf、Gemini）统一遵循

---

## ADR-0003 · 不做安全强化

**日期**：2026-06-18
**状态**：Accepted（仅在玩具场景有效）

### 背景

目标用户为自己 + 朋友 1-2 个俱乐部 <50 人。

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
2. **视觉风格**：Notion-体育 minimalist（2026-06 升级）——hairline 分隔、4:5 海报、Geist Mono 数字 + Newsreader 衬线；与 §8 UI 设计系统**严格同源**（`tokens.ts`），App / H5 / PNG 海报三处视觉一致
3. **积分规则**：标准足球 3-1-0；同分按 净胜球 → 进球数 → 队名 排序
4. **球员标识**：仅名字 + 所在队伍（与零账号体系一致）
5. **Top N**：固定 **5**（`REPORT_TOP_N`）。~~原设计 admin 分享时可选 1–20~~；2026-06 UI 升级后移除 `?topN=` query 与前端选择器，简化分享流程
6. **H5 加成**：战报页面头部固定 CTA 跳转到活动主页（促进复访）

### 后果

**正面**：
- 设计令牌单点维护，杜绝"App 与海报色板不一致"漂移
- 满足"现场快速分享 + 活动后总结"双场景
- 标准积分规则用户认知零成本

**负面**：
- 战报 satori 模板需与 React 组件保持结构同源，开发上需注意（用 React 写 + satori 兼容子集）
- 长图海报改为固定 4:5 高度（1350/1620），边缘场景需 snapshot 回归

### 关联文档

- `docs/ARCHITECTURE_V2.md` §7（战报渲染整章）+ §8.3（设计系统）+ §4.2（API 表新增 game/event 两套 report/poster 端点）
- `DEVELOPMENT_PLAN.md` §2.3 T2.4-T2.7（Phase 2 任务）

---

---

## ADR-0006 · 生产环境旧运行时清理

**日期**：2026-06-18
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

ECS 上残留旧运行时（Spring Boot、MySQL、Java/Maven），占用端口与内存，与 Node + SQLite 技术栈不兼容。

### 决策

| 维度 | 选择 |
|---|---|
| 现网在用？ | 无人在用，可随时下线 |
| 数据处置 | `mysqldump` 全量导出 → gzip → 本地保管 |
| 下线深度 | 彻底卸载 MySQL / Java / Maven / 旧 systemd 服务 |
| 执行时机 | Phase 0 立即执行 |
| Nginx 处置 | 仅删旧 site conf，保留 Nginx 本体 |

### 后果

**正面**：
- 端口 8080 / 3306 释放
- JVM + MySQL 约 600-800MB 常驻内存释放（1G ECS 上至关重要）
- 磁盘释放 ≥ 1GB

**负面**：
- 一旦执行不可逆；需在执行前反复验证 dump 完整性

### 关联文档

- `DEVELOPMENT_PLAN.md` Phase 0 T0.3 + Gate

---

## ADR-0007 · GitHub Actions push 部署 + Nginx 留任 + 部署链路提前到 Phase 0 末

**日期**：2026-06-19
**状态**：Accepted
**决策者**：需求方 + 接手架构师

### 背景

ADR-0001 选定 systemd + Caddy 的部署形态作为远景。但实际进入 Phase 0 末时面对三个具体问题：

1. **触发方式**：GitHub Actions 推、ECS pull、webhook 触发，还是容器编排？webhook 方案密钥管理散乱，且构建在 ECS 上做会跟应用抢内存。
2. **Caddy vs Nginx**：架构文档写的是 Caddy（自动 HTTPS），但 ECS 上 Nginx 已在跑，且当前域名/HTTPS 不是 Phase 0 必需。
3. **实施时机**：原计划部署是 Phase 3 的事，但前两个 Phase 完全本地开发，会推迟"真机问题"暴露时间。

### 决策

| 维度 | 选择 |
|---|---|
| **构建位置** | GitHub Actions runner（ubuntu-latest），不在 ECS 构建 |
| **触发方式** | push to main 自动触发；可手动 `workflow_dispatch` |
| **传输方式** | scp tarball → ssh 调用 `deploy-receive.sh` |
| **凭证** | 专用 ed25519 deploy key（`~/.ssh/pitchmaster_deploy`），私钥进 GitHub Secrets，公钥进 ECS `~/.ssh/authorized_keys` 带 `no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty,no-user-rc` 限制 |
| **Release 布局** | `/opt/pitchmaster-v2/releases/<ts-sha>/` + `current` symlink + `shared/{data.db,.env,node_modules}` |
| **切换方式** | `ln -sfn` 原子切换 + `systemctl restart` |
| **失败处理** | `deploy-receive.sh` 内 15 次 1 秒间隔 health check，失败自动 `ln -sfn` 回上一版 + restart |
| **Web 服务器** | **保留 Nginx**（ECS 上已安装，无需再装 Caddy），路由：`/api/* → :3000`，其它 → `/opt/pitchmaster-v2/current/web/dist`，SPA fallback |
| **HTTPS** | Phase 3 加；当前阶段 HTTP 即可（玩具项目，无真实用户） |
| **实施时机** | **Phase 0 末提前完成**（在 hello-world 脚手架上先跑通整条链路，而非等到 Phase 3） |

### 替代方案对比

| 方案 | 弃用理由 |
|---|---|
| ECS pull + cron | 轮询浪费 + 1 分钟最大延迟 |
| webhook 模式 | 密钥管理散乱，存在默认占位密钥风险 |
| Watchtower / 镜像编排 | 引入容器与镜像仓库，违背 minimalist 原则 |
| forced command 限定 deploy 脚本 | Phase 0 阶段需要 scp 上传 tarball，forced command 会拦死；后续可通过 rrsync 模式加固，列入 Phase 3 改进项 |

### 后果

**正面**：
- push 即部署，开发→上线延迟从"手动操作"降到 ~2 分钟
- 构建放 Actions，ECS 不抢内存（1.8 GiB 小机器关键）
- Release 留 5 份，回滚秒级
- 凭证集中在 GitHub Secrets，比 webhook 硬编码密钥安全得多
- 真机问题从 Phase 0 末即可暴露，而非等到 Phase 3

**负面**：
- 任何代码改动都会触发部署，对 docs-only commit 浪费一次 Actions（已用 `paths-ignore` 缓解）
- deploy key 私钥仍存在 GitHub Secrets，理论上 GitHub admin / Actions 修改者可读取（玩具项目可接受；生产应配合 short-lived OIDC token + cloud IAM 改造）
- forced command 加固延后到 Phase 3
- 单实例无 blue-green：deploy 期间 ~1 秒服务中断

### 关联文档

- `docs/DEPLOYMENT.md` · 完整设计、拓扑、checklist
- `deploy/scripts/ecs-bootstrap.sh` · ECS 一次性初始化
- `deploy/scripts/deploy-receive.sh` · ECS 侧接收脚本
- `deploy/systemd/pitchmaster-v2.service` · systemd unit
- `deploy/nginx/pitchmaster-v2.conf` · Nginx site
- `.github/workflows/deploy.yml` · GitHub Actions workflow

---

## ADR-0008 · Phase 5 多人录入（S2/S3）— 已回滚

**日期**：2026-06-19（立项）· 2026-06-19（回滚）
**状态**：**Rejected**（需求方决定回退至 S1）
**决策者**：需求方

### 背景

曾立项 Phase 5A（Editor Lease / S2）与 Phase 5B（Multi-Writer / S3），并已合并上线（commit `91701b2`）。内测反馈：租约交接 + 多写者 reconcile 复杂度高、现场收益有限。

### 决策

| 维度 | 选择 |
|---|---|
| **目标状态** | **S1**：单设备录入 + 多端 SSE 只读观战 |
| **换机** | 继续用分享码 + PIN 恢复 `adminToken`（`/admin/restore`） |
| **代码** | `git revert 91701b2` 移除 lease / version / multi-writer |
| **线上 DB** | 已执行的 `0001`/`0002` migration 列可保留（SQLite 冗余列无害）；不追 down migration |

### 后果

- 产品回到「同一场比赛只一个管理员设备录入」假设（`ARCHITECTURE_V2.md` §6.4）
- 删除：`editor-lease.service`、`EditorLeaseBanner`、`use-editor-lease`、`reconcile-game` 等
- 多人协同录入列为 v3+ 候选，需重新 ADR 方可启动

### 关联

- Revert commit：`1cc1ee1`
- `DEVELOPMENT_PLAN.md` §5 阶段日志

---

> 后续 ADR 在此追加，编号递增。
