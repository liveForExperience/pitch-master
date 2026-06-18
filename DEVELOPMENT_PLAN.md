# PitchMaster v2 · 开发计划（DEVELOPMENT_PLAN）

> **状态**：草案 v0.1 · 待需求方签署后执行
> **签署人**：需求提出者（项目所有者） · 执笔人：接手架构师
> **配套文档**：[`AGENTS.md`](./AGENTS.md)（AI 上下文） · [`docs/ARCHITECTURE_V2.md`](./docs/ARCHITECTURE_V2.md)（技术蓝图） · 本文件（路线 + 阶段 + 验收）
>
> 本文件是 **路线图与验收门禁**。技术实施细节（DDL、API 字段、算法伪代码、目录约定）一律放在 `ARCHITECTURE_V2.md`，避免重复维护。

---

## 0. 决策矩阵（已签署）

| # | 决策点 | 选择 |
|---|---|---|
| D1 | 项目方向 | **推倒重做**，v1 整体归档到 `legacy/`，git 打 tag `legacy/v1-final` |
| D2 | 目标用户 | 自己 + 朋友 1-2 个俱乐部，<50 人，玩具工具 |
| D3 | 安全投入 | 暂不投入（不做密码强化、CSRF、限流、审计） |
| D4 | 文档体系 | 单一 `AGENTS.md` + `DEVELOPMENT_PLAN.md` + `docs/ARCHITECTURE_V2.md`，删除 `GEMINI.md` / `.windsurfrules` / 老 docs |
| D5 | 测试门禁 | 后端核心模块（事件流、计时、战报派生）单测 ≥ 60%；前端 0 强制 |
| D6 | 业务删减 | 完全删除：互评、三维 FM 评分、Tournament/Club 两级租户、Late Cancellation 费用、复杂权限 |
| D7 | Apple Watch | Phase 4 可选；Phase 1-3 不做，但后端 API 设计上需"Watch-friendly"（短载荷、原子操作、可重放） |
| D8 | 账号体系 | **零 SMS / 零邮件**；创建者本机生成"管理员令牌"存 localStorage + 6 位 PIN（可拾回） |
| D9 | 后端栈 | **Node 20 + TypeScript + Hono + Drizzle ORM + SQLite** |
| D10 | 数据库 | SQLite 单文件，备份 = 复制 `.db`；不引入容器化 DB |
| D11 | 前端栈 | **React 18 + Vite + TS + Tailwind + Radix UI + Zustand + PWA** |
| D12 | 计时器 | 服务器权威 `startTime` + 客户端只显示，差值法 |
| D13 | 战报 | 图片海报（服务端用 `satori` 渲染 PNG）+ 只读 H5 链接 双产物 |
| D14 | 离线 | PWA + IndexedDB 本地事件队列 + 联网后按客户端时间戳 replay |
| D15 | 部署 | 单台 ECS：systemd + Caddy（自动 HTTPS）+ SQLite 文件 · Phase 3 前都可纯本地 + IP 跑通 |

> 任何决策的变更，必须更新本表 + 修订 ARCHITECTURE_V2.md 对应章节，且在 §13 阶段记录登记变更原因与影响范围。

---

## 1. 北极星指标与产品边界

### 1.1 北极星指标（决定一切优先级）

> **"现场操作者从打开页面到记下一个进球，**耗时 ≤ 8 秒**；从活动结束到看到可分享战报，耗时 ≤ 3 秒。"**

任何特性如果伤害这两个数字，一律 reject。

### 1.2 In-Scope（v2 必须做）

1. 创建活动（输入名字 + 选择球队数）
2. 配置队伍：每队"点几下名字加人"
3. 自由对阵：手动选两支队开打（不做自动分组）
4. 比赛中：开始/暂停/恢复/结束 计时
5. 记录事件：进球 / 助攻 / 乌龙 / 撤销
6. 多端实时观战（SSE）
7. 离线录入 + 联网回放
8. 活动结束生成战报（图片 + H5）
9. 通过 6 位 PIN + 短码访问只读看板

### 1.3 Out-of-Scope（v2 明确不做）

- 用户注册 / 密码 / 角色权限矩阵
- Tournament / Club 两级租户
- 球员档案、身价、能力面板
- 评分系统（任何形式）
- 互评 / MVP 投票（不做投票，由数据自动派生 MVP = 进球 + 助攻最多者）
- 费用结算与分摊
- 海报模板自定义
- 多语言（仅简体中文）

### 1.4 Should-Have（v3+ 候选）

- watchOS 原生 app（Phase 4 可启动）
- 球员身份在多次活动间复用（"我的常客"）
- 自动均衡分组建议
- 历史数据报表

---

## 2. 阶段计划

> **总周期**：约 7-9 周（按业余时间投入，每周 8-12 小时估算）。每阶段尾置一道验收门禁（Gate），未通过不得进入下一阶段。

### 2.1 Phase 0 · 准备（W1，约 4-6 小时）

**目标**：v1 归档完毕，v2 新工程脚手架站立。

| 任务 | 产出物 | 验收 |
|---|---|---|
| T0.1 v1 归档 | `legacy/` 目录包含原 `src/`、`frontend/`、`docs/`、`deploy/`、老配置文件 | 根目录除文档外仅剩 `backend/`、`web/`、`legacy/`、`deploy/` |
| T0.2 Git tag | `git tag legacy/v1-final && git tag v2-start` | `git tag -l` 看到两个 tag |
| T0.3 删除 v1 AI 上下文 | 删 `GEMINI.md`、`.windsurfrules`、`.windsurf/`、`TODO.md`、根目录 `backend.log`、`frontend/dev*.log` | `git status` 不再含上述文件 |
| T0.4 创建 v2 骨架 | `backend/` Hono 工程 + `web/` Vite 工程 + 根 `package.json`（npm workspaces） + `bin/dev.sh` 一键启动 + `docs/DEPLOYMENT.md` 草案 | `npm install` 在根目录一次装好；`npm run dev:backend` 和 `npm run dev:web` 都能起来；`GET /api/health` 返回 ok；vite 反代 `/api/*` 通 |
| T0.5 写 README.md | 重写根 README，只保留 v2 信息 | README 不再提 Spring/MySQL/FM 评分 |
| T0.6 v1 运行时下线 + 数据归档 | `deploy/scripts/legacy-shutdown.sh` + `docs/LEGACY_SHUTDOWN.md` + `legacy/db-dump/pitch_master-*.sql.gz` | ECS 上 systemd/MySQL/Java/Maven 全部卸载，端口 8080/3306 释放；MySQL dump 已归档进仓库（或 LFS / 本地保管） |

**Phase 0 Gate**：
- ✅ `legacy/` 完整，可被独立 checkout 使用
- ✅ `backend/`、`web/` 两个工程都能 `npm run dev:backend|web` 启动，前端经 vite proxy 拉到后端 `/api/health` 返回 200
- ✅ 根目录无任何 v1 残留运行时文件
- ✅ v1 ECS 已下线（`systemctl status pitchmaster` → Unit not found）
- ✅ MySQL dump 已归档（仓库 `legacy/db-dump/` 或本地受控位置）
- ✅ ECS 上 `mysql --version` / `java -version` 均报 not found（资源已让出）
- ✅ 部署方案已成文（`docs/DEPLOYMENT.md`，待 Phase 3 实施）

---

### 2.2 Phase 1 · MVP 在线版（W2-W4，约 28-32 小时）

**目标**：单设备、在线、能完整跑完"建活动 → 选队伍 → 开赛 → 记进球 → 出战报"闭环。

> 这是项目的灵魂阶段。Phase 1 通过 = 你已经可以带着这工具去球场用了（只是离线/Watch/海报后面再加）。

#### 任务分解

**T1.1 数据库与迁移**（参见 `ARCHITECTURE_V2.md` §3）
- 5 张表 DDL：`event`、`team`、`roster`、`game`、`game_event`
- Drizzle schema 定义 + 初始 migration
- 启动时自动 migrate

**T1.2 后端 API（在线版，无离线队列）**
- `POST /api/events` 创建活动 → 返回 `{id, shortCode, adminToken}`
- `GET /api/events/:shortCode` 只读活动详情
- `POST /api/events/:id/teams` 创建队伍
- `POST /api/teams/:id/roster` 加人（数组）
- `POST /api/events/:id/games` 创建场次（指定 A/B 两队）
- `POST /api/games/:id/start` 开始（写 `actualStartTime`）
- `POST /api/games/:id/pause` / `resume` / `finish`
- `POST /api/games/:id/events` 写入事件（GOAL/ASSIST/OWN_GOAL）
- `DELETE /api/games/:id/events/:eventId` 撤销事件
- `GET /api/games/:id/state` 返回当前比分 + 计时

> 所有写入接口校验 `Authorization: Bearer <adminToken>` 或 `?pin=XXXXXX`。具体认证流见 `ARCHITECTURE_V2.md` §5。

**T1.3 前端页面（移动竖屏优先）**
1. `/`：最近活动列表 + [+] 新建
2. `/events/new`：3 步表单（名字 → 队伍数 → 队伍名）
3. `/events/:shortCode`：活动主页（卡片：每场比赛比分 + 进度）
4. `/events/:shortCode/setup`：队伍配置（每队点击添加队员名字）
5. `/games/new?eventId=...`：选两个队 → 开战
6. `/games/:id/record`：录入页（大按钮 GOAL/ASSIST/UNDO，顶部计时）
7. `/games/:id`：只读详情（事件流 + 比分）

**T1.4 计时器（服务器权威）**
- 后端：`game.start_time` (DB) + Hono 路由 `GET /api/time` 返回 `{serverNow}` (ISO 8601 UTC)
- 前端：启动时计算 `clientOffset = serverNow - clientNow`，显示时 `elapsed = now() + clientOffset - startTime`
- 暂停/恢复：维护 `totalPausedMs` 字段

**T1.5 实时推送（SSE）**
- `GET /api/games/:id/stream` (SSE)
- 任何事件写入后 broadcast `{type, gameEvent, scoreA, scoreB}`
- 前端 EventSource 订阅，自动重连

**T1.6 后端测试（核心 60% 门禁）**
- `game.service.test.ts`：事件流 → 比分派生（GOAL/OWN_GOAL/UNDO 各场景）
- `timer.service.test.ts`：start/pause/resume/finish 计时
- `event.service.test.ts`：建活动 + 加队员 + 唯一 shortCode

#### Phase 1 Gate（缺一不可）

- ✅ 浏览器开 `localhost:5173`，1 分钟内完成：建活动 → 配 2 队各 5 人 → 选队开赛 → 记 3 个进球 → 看到比分实时变化
- ✅ 另一个浏览器开同一个 `shortCode`，进球后 ≤ 2 秒看到分数同步
- ✅ 后端 `npm test` 全绿，覆盖率 ≥ 60%（核心 services）
- ✅ 关掉所有终端后再起，数据完整保留（SQLite 文件持久化验证）

---

### 2.3 Phase 2 · 离线 + 战报（W5-W6，约 22-26 小时）

**目标**：球场 Wi-Fi 烂也不影响记录；活动结束一键出战报。

#### 任务分解

**T2.1 PWA 基础设施**
- `vite-plugin-pwa` 配置：manifest + service worker
- 添加到主屏图标 + 离线兜底页
- App Shell 缓存策略（HTML/JS/CSS stale-while-revalidate）

**T2.2 本地事件队列（核心难点）**
- IndexedDB 表 `outbox`：`{id, gameId, type, payload, clientTs, status}`
- 录入页所有写操作：先写 outbox（立即 UI 响应）→ 后台 worker 推送 API
- 网络恢复检测 → 自动 flush
- 冲突策略：见 `ARCHITECTURE_V2.md` §6

**T2.3 服务端 replay 接口**
- `POST /api/games/:id/events/batch`：接收 `[{type, payload, clientTs}]`，按 clientTs 排序后写入
- 幂等保证：每条事件携带客户端生成的 `clientEventId` (UUID)，服务端 unique 约束

**T2.4 战报：派生数据 + API**
- `report.service.ts`：实现 `computeStandings / topScorers / topAssists / eventMvp / gameMvp`（见 `ARCHITECTURE_V2.md` §7.2）
- 单元测试：积分榜排序稳定性、并列时的 tie-breaker、空数据兜底
- API：`GET /api/games/:id/report`、`GET /api/events/:id/report?topN=`

**T2.5 战报：UI 组件（共享给 App / H5 / 海报）**
- 在 `web/src/components/ui/` 实现 `Card / Section / TeamBadge / RankBadge / StatusChip / StatRow / ScoreBoard`（见 `ARCHITECTURE_V2.md` §8.3.4）
- 共享 `tokens.ts` 统一色板/字号/间距，**禁止 hardcode 颜色**
- 两个战报页面：`/events/:shortCode/report`、`/games/:id/report`，复用上述组件

**T2.6 战报：图片海报（satori）**
- 安装 `satori` + `@resvg/resvg-js` + `subset-font`
- 字体子集化打包到 `backend/src/assets/fonts/`（Regular + Bold 各 ≤250KB）
- 实现 `EventPosterTemplate`、`GamePosterTemplate`（与 T2.5 UI 组件结构同源）
- API：`GET /api/games/:id/poster.png`、`GET /api/events/:id/poster.png?topN=`
- 缓存：活动海报按 `(eventId, topN, lastEventTs)` 缓存 60s
- 落到 `assets/snapshots/` 的 PNG 比对作为视觉回归测试

**T2.7 分享集成**
- 战报 H5 顶部 CTA："想下次也来踢吗？→ 进活动主页"
- 活动主页 / 单场详情提供"分享战报"按钮：admin 可选 `topN` (1-20，默认 5)
- Web Share API：图片 + 文案 + H5 链接（fallback 复制链接到剪贴板）

#### Phase 2 Gate

- ✅ 飞行模式下：录入 5 个进球 + 1 个撤销，UI 全部即时响应
- ✅ 恢复网络 10 秒内，服务端能查到全部事件且顺序正确
- ✅ 同一事件重复提交（模拟弱网重试）只生效 1 次（幂等）
- ✅ 单场结束页一键出"单场战报"图片 + H5
- ✅ 活动主页点击"出战报" → 选 `topN` → 3 秒内显示长图海报 + H5 链接
- ✅ 积分榜单测覆盖：含平局、并列、零数据三种边界
- ✅ H5 战报与 PNG 海报视觉一致（人工目视 + snapshot 比对）
- ✅ 战报 PNG 字体大小 ≤ 500KB 合计（regular + bold 子集后）

---

### 2.4 Phase 3 · 上线（W7-W8，约 12-16 小时）

**目标**：朋友能通过 IP 或域名访问；7×24 稳定 1 周以上。

| 任务 | 产出物 |
|---|---|
| T3.1 部署脚本 | `deploy/scripts/install.sh` 一键装 Node + systemd + Caddy + SQLite |
| T3.2 配置 systemd | `pitchmaster-v2.service` 自启动、日志走 journald |
| T3.3 Caddy 自动 HTTPS | 即使先用 IP，也用 Caddy 自签证书避免浏览器警告 |
| T3.4 备份脚本 | `deploy/scripts/backup.sh` 定时 `cp pitchmaster.db pitchmaster-YYYYMMDD.db` |
| T3.5 监控（极简） | `/healthz` 端点 + uptime 监控（用 UptimeRobot 免费版） |
| T3.6 上线灰度 | 邀请 3-5 人内部测试 2 周，记录 bug 到 `docs/issues-tracking.md` |

#### Phase 3 Gate

- ✅ 远程访问可用，HTTPS 工作
- ✅ 数据库每日备份且可被恢复（演练一次）
- ✅ 内测期间无数据丢失，关键路径 bug ≤ 3 个

---

### 2.5 Phase 4 · Apple Watch（可选 · 待启动）

**触发条件**：Phase 1-3 全部跑顺 + 用户确认 Apple Developer 账号到位 + 真实需要在球场用 Watch 而不是手机。

**预估投入**：3-4 周 Swift 学习曲线 + 实施。本文件不展开，待启动时单独写 `WATCH_PLAN.md`。

---

## 3. 风险登记册

| ID | 风险 | 等级 | 缓解 |
|---|---|---|---|
| R1 | 离线队列冲突合并复杂度高（多设备同时录入同一场比赛） | 高 | Phase 1 仅允许"管理员设备"录入，多端只读；Phase 2 离线也按这个前提 |
| R2 | satori 中文字体支持需要打包字体文件 | 中 | 预先打包 Noto Sans SC subset (~200KB)，写入 `backend/assets/fonts/` |
| R3 | SQLite 在并发写入 > 100 QPS 时会阻塞 | 低 | 玩具场景永远到不了；如真触发就加 WAL 模式（已默认开启） |
| R4 | 用户更换设备导致 adminToken 丢失，PIN 也忘 | 中 | UI 强提示"截图保存 PIN"；后台保留管理员后门：知道活动 ID 的人 + 物理访问服务器可恢复 |
| R5 | Caddy 自签证书在 iOS 上"不受信任" | 中 | Phase 3 中期决定是否买域名；自签 + 信任证书的引导文档备好 |
| R6 | 我（执笔人）若中途退出，接手者能否跑通 | 高 | 三份文档（PLAN/AGENTS/ARCH）必须做到"读完就能开工"，每个 Phase Gate 都附自检清单 |

---

## 4. 待决事项（每次阶段评审更新）

| ID | 事项 | 待决方 | 截止 |
|---|---|---|---|
| O1 | 是否买域名 + 备案 | 需求方 | Phase 3 中期 |
| O2 | 球场 GPS 自动识别活动地点？ | 需求方 | Phase 2 评审 |
| ~~O3~~ | ~~战报海报视觉风格~~ | ~~已决~~ | **已决 2026-06-18：风格 B 卡片浅底长图，详见 ADR-0005** |
| O4 | 黑/白色主题切换是否必要？ | 需求方 | Phase 1 评审 |

---

## 5. 阶段实施日志（执行时由开发者追加）

> 模板（每次 commit 后更新一段）：
>
> ```
> ## YYYY-MM-DD · Phase X · 完成项
> - [x] T1.1 数据库与迁移（commit: abc1234）
> - [ ] T1.2 后端 API 进行中，已完成 events/teams，roster 中
>
> ### 遇到的困难
> - SQLite WAL 模式在 systemd 下需要给 data 目录写权限……
>
> ### 计划变更
> - 原 T1.5 SSE 推送提前到 T1.3 完成（前端调试更方便）
> ```

### 2026-06-18 · Phase 0 · 文档体系建立 + v1 资产归档

- [x] T0.1 v1 代码归档至 `legacy/`（commit `c3cc22a`）
- [x] T0.2 git tag `legacy/v1-final` + `v2-start`
- [x] T0.3 删除 v1 AI 上下文文件（GEMINI.md / .windsurfrules / .windsurf/ / TODO.md / *.log）
- [x] T0.5 重写根 README.md 为 v2 视角
- [x] 三份核心文档产出：`AGENTS.md`、`DEVELOPMENT_PLAN.md`、`docs/ARCHITECTURE_V2.md`、`docs/DECISIONS.md`（4 条 ADR）

#### 阶段内增补
- 战报需求扩展为两层 + 三榜（commit `ca479a5`，详见 ADR-0005）
- v1 运行时下线方案与工具（commit `9be7490`，详见 ADR-0006）

### 2026-06-19 · Phase 0 · T0.6 v1 运行时彻底下线（已完成）

实施过程：

| 步骤 | 动作 | 结果 |
|---|---|---|
| 1 | ssh root@8.153.145.81 资产盘点 | 主机 Alibaba Cloud Linux 3，2C/1.8G/40G；v1 占内存 ~310MB / 磁盘 547MB；MySQL 8.0.33（手工 tar 安装）/ pitch_master 库 20 表 0.79MB |
| 2 | 执行 `legacy-shutdown.sh --dump-only` | 配置备份成功；mysqldump 因 sudo PATH 未含 /usr/local/bin 而跳过 |
| 3 | 改用绝对路径 `/usr/local/bin/mysqldump` 手动备份 | `pitch_master-20260619-002357.sql.gz` 仅 11KB，含 20 张表 + flyway_schema_history |
| 4 | scp 拉回本地 → 验证 dump 完整性 → `legacy/db-dump/` 归档 | commit `99f2017` |
| 5 | stop + disable + rm pitchmaster.service | ✅ Unit not found |
| 6 | rm /etc/nginx/conf.d/pitchmaster.conf + reload nginx | ✅ Nginx 仍 active 保留 |
| 7 | DROP DATABASE pitch_master | ✅ 仅剩系统库 |
| 8 | 后台 rm -rf /opt/pitchmaster /etc/pitchmaster /opt/maven | ✅ 全消失（547MB 释放） |
| 9 | stop + disable + rm mysqld.service；清理 /usr/local/mysql、/var/lib/mysql、/etc/my.cnf、所有 /usr/local/bin/mysql* 符号链接 | ✅ mysql 命令 not found |
| 10 | rm /usr/lib/jvm/jdk-21.0.7+6 + /etc/profile.d/{java,maven}.sh + sed 清 /etc/profile 中 maven PATH | ✅ java/mvn 命令 not found |
| 11 | rm /root/projects（用户本地 v1 副本）、/etc/profile.bak、/root/legacy-shutdown.sh | ✅ 全清 |
| 12 | 最终验收 | 见下表 |

资源对比：

| 指标 | 下线前 | 下线后 | 变化 |
|---|---|---|---|
| 内存使用 | 1.1 GiB | 404 MiB | **释放 826 MiB** |
| 内存空闲 | 87 MiB | 913 MiB | +826 MiB |
| 磁盘使用 | 12 GB | 9.7 GB | **释放 2.3 GB** |
| 端口 8080 | 监听 | 无监听 | 释放 |
| 端口 3306 | 监听 | 无监听 | 释放 |
| 端口 80 | Nginx + v1 site | Nginx 仅默认 | 保留供 v2 |

收尾清理（同日完成）：
- 删除 `/var/backups/pitchmaster-v1/`（含 env 明文密码的服务器侧备份，本地仓库已归档）
- 调查发现 :9000 端口的 `webhook` 进程实为 v1 部署自动化工具（[adnanh/webhook](https://github.com/adnanh/webhook)），配置 hook `pitchmaster-deploy` 指向已删除的 `/root/projects/deploy-wrapper.sh`，且 `hooks.json` 使用默认密钥 `your-secret-token`，存在轻微安全隐患
- 完整卸载 webhook：stop + disable + rm webhook.service + rm /etc/webhook + rm /usr/local/bin/webhook，释放 23 MB 内存
- 服务器最终监听端口：22 (sshd) + 80 (nginx，无 site) + 111/5355 (系统服务) + 127.0.0.1:42819 (阿里云监控)

残留（保持原样）：
- `/root/.bash_history` 含 v1 部署命令历史，无敏感信息

### 2026-06-19 · Phase 0 · T0.4 v2 脚手架（已完成）

实施过程：

| 步骤 | 动作 | 结果 |
|---|---|---|
| 1 | 建 `backend/`（Hono + @hono/node-server + tsx + vitest + TS strict） | health 路由 + Hono request 测试通过 |
| 2 | 建 `web/`（Vite 6 + React 18 + TS + Tailwind 3 + Zustand） | 首屏调用 `/api/health` 渲染 backend metadata |
| 3 | 引入 npm workspaces（root `package.json`） | 解决 npm 11 找不到 sub-package.json 的问题，且让 `npm install` 一次装好两端 |
| 4 | `bin/dev.sh` 一键并发启动两端，子进程同生共死 | trap INT/TERM 同步清理 |
| 5 | `.nvmrc` 锁 Node 20 | 与 ARCHITECTURE_V2 §10.2 / DEPLOYMENT 一致 |
| 6 | 同时把 `docs/DEPLOYMENT.md` 草案落盘（GitHub Actions → ECS deploy key + symlink 切换 + 失败回滚） | Phase 3 实施前定稿，本阶段不动手 |
| 7 | 联调验收 | backend `:3000/api/health` 直连 + 经 vite `:5173` 反代均返回 `{status:"ok",...}` ✓；vitest 2/2 通过 ✓；两端 typecheck 全绿 ✓ |

技术决策：
- **npm workspaces vs 各自独立** —— 选 workspaces。npm 11 在子目录跑 `npm install` 时会向上回溯找 prefix，若仓库根没有 `package.json` 就 ENOENT；workspaces 顺道把"一键 install + 一键 dev"打通，零成本。生产部署沿用 root npm ci 后再 build 各 workspace。
- **backend 端口 3000** —— 与 ARCHITECTURE_V2 §10.3 Caddyfile `reverse_proxy localhost:3000` 严格对齐。
- **vite 反代 `/api/*` → :3000** —— 开发期前后端同源，无需 CORS 临时配置；生产期由 Caddy 同样的 path 规则反代，前端代码零修改。

下一步：进入 Phase 1。先实现 T1.1（Drizzle schema + 5 张表 + 迁移）打地基。

### 2026-06-19 · Phase 0 增补 · 部署链路提前落地（ADR-0007，进行中）

需求方决定不等 Phase 3，把 GitHub → ECS 部署链路提前到 Phase 0 末实施，理由是越早让 ECS 跑起来越早暴露真机问题。详见 ADR-0007。

本次完成：

| 步骤 | 动作 | 结果 |
|---|---|---|
| 1 | 本地生成 `~/.ssh/pitchmaster_deploy` ed25519 keypair（专用） | OK |
| 2 | 写 `deploy/systemd/pitchmaster-v2.service`（systemd unit，含资源限制 400M / 沙箱化） | OK |
| 3 | 写 `deploy/scripts/deploy-receive.sh`（解包 → symlink 切换 → restart → 15 次健康检查 → 失败回滚） | OK |
| 4 | 写 `deploy/scripts/ecs-bootstrap.sh`（一次性初始化，幂等） | OK |
| 5 | 写 `.github/workflows/deploy.yml`（main push 自动触发；typecheck + test + build + scp + ssh deploy + public health 验证） | OK |
| 6 | 写 `deploy/nginx/pitchmaster-v2.conf`（`/api/* → :3000`，其余 → web/dist + SPA fallback） | OK |
| 7 | scp `deploy/` 整目录到 ECS，跑 bootstrap：装 Node 22（满足 >=20）/ 建目录 / 装 deploy key（带 5 项限制） / 装 systemd unit / enable | OK |
| 8 | 用 deploy key 登录 ECS 验证 `whoami` + `ls /opt/pitchmaster-v2/` | OK，登录通 |
| 9 | 把 Nginx site 落上 ECS，注释掉 `/etc/nginx/nginx.conf` 默认 server 块，reload nginx | OK，无冲突警告 |
| 10 | 公网验收：`curl http://8.153.145.81/` 与 `/api/health` 分别返回 500、502（预期，因 web/dist 尚无、backend 未启动） | OK，链路通 |

待用户配合：在 GitHub 仓库 Settings → Secrets and variables → Actions 设置 4 个 secret：
- `DEPLOY_SSH_KEY` = `~/.ssh/pitchmaster_deploy` 全文
- `DEPLOY_HOST` = `8.153.145.81`
- `DEPLOY_USER` = `root`
- `DEPLOY_KNOWN_HOSTS` = `ssh-keyscan 8.153.145.81` 输出

配置完成后 push 任意代码到 main 即可触发部署，预期最终：
- `curl http://8.153.145.81/api/health` → `{"status":"ok",...}`
- 浏览器访问 `http://8.153.145.81/` → 看到 hello-world 脚手架页（"PitchMaster v2 · 球场速记 · 脚手架就绪"）

---

## 6. 签署

- [ ] 需求方已阅读并同意 §0 决策矩阵
- [ ] 需求方已阅读并同意 §1 范围界定
- [ ] 需求方已阅读并同意 §2 阶段计划
- [ ] 需求方已确认 §3 风险与 §4 待决事项

签署日期：____________
