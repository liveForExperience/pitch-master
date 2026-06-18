# PitchMaster v2 · 技术架构蓝图

> **状态**：草案 v0.1
> **配套**：[`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md)（路线 + 阶段） · [`../AGENTS.md`](../AGENTS.md)（AI 上下文）
>
> 本文件是 **技术参考的唯一真源**。DDL、API、算法、目录约定一律在此维护。开发者写代码前先 grep 本文件。

---

## 1. 系统拓扑

```
                ┌─────────────────────────────────────┐
                │     用户设备 (浏览器 PWA)            │
                │  ┌───────────────────────────────┐  │
                │  │ React + Vite + Tailwind       │  │
                │  │ Zustand (UI state)            │  │
                │  │ IndexedDB outbox (离线队列)   │  │
                │  │ EventSource (SSE 订阅)        │  │
                │  └───────────────────────────────┘  │
                └────────────┬────────────────────────┘
                             │ HTTPS
                ┌────────────▼────────────────────────┐
                │ Caddy (auto HTTPS)                   │
                │   reverse_proxy → :3000              │
                └────────────┬────────────────────────┘
                             │
                ┌────────────▼────────────────────────┐
                │  Node 20 + Hono (单进程)             │
                │  ┌────────────────────────────────┐ │
                │  │ Routes  (REST)                 │ │
                │  │ Services (业务)                │ │
                │  │ Drizzle ORM                    │ │
                │  │ SSE Broker (in-memory)         │ │
                │  │ Satori (海报渲染)              │ │
                │  └────────────────────────────────┘ │
                └────────────┬────────────────────────┘
                             │
                ┌────────────▼────────────────────────┐
                │  SQLite 文件 (WAL 模式)              │
                │  /var/lib/pitchmaster/data.db        │
                └─────────────────────────────────────┘
```

**关键约束**：
- 单进程 Node 服务器（不需要集群；玩具场景）
- SQLite 单文件，WAL 模式，备份 = `cp`
- SSE 连接池在 Node 进程内存，进程重启即重连（前端自动）
- 服务端持有"权威时间"（所有 `created_at`、`started_at` 都以 server clock 为准）

---

## 2. 目录结构

```
pitch-master/
├── AGENTS.md                       # AI 上下文（合并后唯一）
├── DEVELOPMENT_PLAN.md             # 路线 + 阶段 + 验收
├── README.md                       # 用户角度的简介与快速上手
├── docs/
│   ├── ARCHITECTURE_V2.md          # 本文件
│   └── DECISIONS.md                # ADR 记录（重大决策变更追加）
├── legacy/                         # v1 全量归档（只读参考）
│   ├── README.md                   # 说明"已废弃，仅参考"
│   ├── backend/                    # 原 src/main, src/test
│   ├── frontend/                   # 原 frontend/
│   ├── docs-v1/                    # 原 docs/
│   └── deploy-v1/                  # 原 deploy/
├── backend/                        # v2 Node + Hono 后端
│   ├── src/
│   │   ├── app.ts                  # Hono 入口
│   │   ├── routes/
│   │   │   ├── events.ts
│   │   │   ├── teams.ts
│   │   │   ├── games.ts
│   │   │   ├── events-stream.ts    # SSE
│   │   │   └── poster.ts
│   │   ├── services/
│   │   │   ├── event.service.ts
│   │   │   ├── game.service.ts
│   │   │   ├── timer.service.ts
│   │   │   ├── outbox.service.ts
│   │   │   └── poster.service.ts
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema
│   │   │   ├── client.ts           # better-sqlite3 实例
│   │   │   └── migrations/         # drizzle-kit 生成
│   │   ├── lib/
│   │   │   ├── sse-broker.ts
│   │   │   ├── short-code.ts       # 6 位 base32 生成
│   │   │   └── auth.ts             # adminToken / PIN 校验
│   │   └── assets/
│   │       └── fonts/
│   │           └── NotoSansSC-subset.ttf
│   ├── tests/
│   │   ├── game.service.test.ts
│   │   ├── timer.service.test.ts
│   │   └── outbox.service.test.ts
│   ├── drizzle.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── web/                            # v2 React + Vite + PWA 前端
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/                 # React Router v6
│   │   ├── components/
│   │   │   ├── ui/                 # radix-based 基础组件
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── stores/                 # Zustand
│   │   ├── api/                    # 调用后端
│   │   ├── outbox/                 # IndexedDB 队列
│   │   ├── pwa/                    # SW 钩子
│   │   └── styles/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── deploy/
    ├── scripts/
    │   ├── install.sh
    │   ├── upgrade.sh
    │   └── backup.sh
    ├── systemd/
    │   └── pitchmaster-v2.service
    └── caddy/
        └── Caddyfile
```

---

## 3. 数据模型与 DDL

### 3.1 ER 概览

```mermaid
erDiagram
    EVENT ||--o{ TEAM : has
    EVENT ||--o{ GAME : hosts
    TEAM ||--o{ ROSTER : has
    GAME ||--o{ GAME_EVENT : records

    EVENT {
        TEXT id PK "ulid"
        TEXT short_code "6字符 base32 唯一"
        TEXT name
        TEXT admin_token_hash "sha256(token+pin)"
        TEXT admin_pin "6位数字 明文 (玩具)"
        TEXT status "DRAFT/ONGOING/FINISHED"
        INTEGER created_at "epoch ms"
        INTEGER finished_at
    }
    TEAM {
        TEXT id PK "ulid"
        TEXT event_id FK
        TEXT name
        TEXT color_hex "#RRGGBB"
        INTEGER created_at
    }
    ROSTER {
        TEXT id PK "ulid"
        TEXT team_id FK
        TEXT name
        INTEGER jersey_number "可空"
        INTEGER created_at
    }
    GAME {
        TEXT id PK "ulid"
        TEXT event_id FK
        TEXT team_a_id FK
        TEXT team_b_id FK
        TEXT status "READY/PLAYING/PAUSED/FINISHED"
        INTEGER started_at "epoch ms; READY 时为 NULL"
        INTEGER finished_at
        INTEGER planned_duration_ms "默认 30*60*1000"
        INTEGER paused_duration_ms "累计暂停时长 ms"
        INTEGER pause_started_at "当前暂停起点; null = 非暂停中"
        INTEGER created_at
    }
    GAME_EVENT {
        TEXT id PK "ulid"
        TEXT game_id FK
        TEXT client_event_id "客户端 UUID 幂等键"
        TEXT type "GOAL/OWN_GOAL/ASSIST/UNDO/PAUSE/RESUME/START/FINISH"
        TEXT team_side "A/B; PAUSE 等无意义事件可空"
        TEXT scorer_roster_id "GOAL 必填"
        TEXT assistant_roster_id "ASSIST 可空"
        TEXT undo_target_event_id "UNDO 必填"
        INTEGER client_ts "客户端时间戳"
        INTEGER server_ts "服务端写入时间"
    }
```

### 3.2 索引

```sql
CREATE UNIQUE INDEX idx_event_short_code ON event(short_code);
CREATE INDEX idx_team_event ON team(event_id);
CREATE INDEX idx_roster_team ON roster(team_id);
CREATE INDEX idx_game_event ON game(event_id);
CREATE INDEX idx_game_event_game ON game_event(game_id, server_ts);
CREATE UNIQUE INDEX idx_game_event_idem ON game_event(game_id, client_event_id);
```

### 3.3 派生数据（不存储，查询时计算）

| 派生项 | 公式 |
|---|---|
| 当前比分 | `count(GOAL where team_side=A and not undone) + count(OWN_GOAL where team_side=B and not undone) - ...` |
| 已用时（ms） | `now - started_at - paused_duration_ms - (pause_started_at ? now - pause_started_at : 0)` |
| 剩余时间 | `planned_duration_ms - 已用时` |
| MVP | 进球+助攻最多的 roster；并列取较早出现者 |
| 射手榜 | group by scorer_roster_id, count desc |

---

## 4. API 契约

### 4.1 全局规范

- 所有响应统一：`{ ok: true, data: ... }` 或 `{ ok: false, error: { code, message } }`
- HTTP 状态语义化（200/201/400/401/404/409/500）
- 鉴权方式：写接口需要 `Authorization: Bearer <adminToken>` 或 `?pin=<6位PIN>`
- 时间戳：epoch ms (UTC)，前端显示时转本地时区

### 4.2 端点列表（完整）

| Method | Path | 权限 | 描述 |
|---|---|---|---|
| GET | `/api/time` | 公开 | 返回 `{serverNow: 1718712345678}` 用于时钟校准 |
| POST | `/api/events` | 公开 | 创建活动；返回 `{id, shortCode, adminToken, pin}` |
| GET | `/api/events/:shortCode` | 公开 | 获取活动详情（含 teams + games 列表，不含 adminToken） |
| PATCH | `/api/events/:id` | Admin | 更新名字 / 标记结束 |
| POST | `/api/events/:id/teams` | Admin | 创建队伍 `{name, colorHex?}` |
| PATCH | `/api/teams/:id` | Admin | 更新 |
| DELETE | `/api/teams/:id` | Admin | 删除（队伍下无场次时允许） |
| POST | `/api/teams/:id/roster` | Admin | 批量加人 `{names: ['张三','李四']}` |
| DELETE | `/api/roster/:id` | Admin | 移除队员（未参与场次时） |
| POST | `/api/events/:id/games` | Admin | 创建场次 `{teamAId, teamBId, plannedDurationMs?}` |
| GET | `/api/games/:id` | 公开 | 详情（含事件流 + 派生比分） |
| POST | `/api/games/:id/start` | Admin | 开赛（写 `started_at = now`） |
| POST | `/api/games/:id/pause` | Admin | 暂停 |
| POST | `/api/games/:id/resume` | Admin | 恢复 |
| POST | `/api/games/:id/finish` | Admin | 结束 |
| POST | `/api/games/:id/events` | Admin | 单条事件 |
| POST | `/api/games/:id/events/batch` | Admin | 批量事件（离线 replay） |
| DELETE | `/api/games/:id/events/:eventId` | Admin | 撤销事件（写入 UNDO 而非物理删除） |
| GET | `/api/games/:id/stream` | 公开 | SSE 订阅 |
| GET | `/api/games/:id/report` | 公开 | 单场战报数据 JSON（比分 + 进球流水 + 单场 MVP） |
| GET | `/api/games/:id/poster.png` | 公开 | 单场海报（PNG） |
| GET | `/api/events/:id/report?topN=5` | 公开 | 活动战报数据 JSON（场次结果 + 积分榜 + 射手榜 + 助攻榜 + 活动 MVP），`topN` 默认 5、范围 1-20 |
| GET | `/api/events/:id/poster.png?topN=5` | 公开 | 活动海报（PNG，长图自适应高度），`topN` 同上 |
| GET | `/healthz` | 公开 | `{ok:true, version, uptime}` |

### 4.3 关键请求/响应样例

**POST /api/events**
```json
// Request
{ "name": "周二夜场" }

// Response 201
{
  "ok": true,
  "data": {
    "id": "01HZ...",
    "shortCode": "A4F9KQ",
    "adminToken": "tok_a1b2c3d4e5...",
    "pin": "823517"
  }
}
```

**POST /api/games/:id/events**
```json
// Request
{
  "clientEventId": "uuid-v4-xxxx",
  "type": "GOAL",
  "teamSide": "A",
  "scorerRosterId": "01HZ...",
  "assistantRosterId": "01HZ...",
  "clientTs": 1718712345678
}

// Response 201
{
  "ok": true,
  "data": {
    "event": { /* 完整 game_event 记录 */ },
    "scoreA": 2,
    "scoreB": 1
  }
}
```

**SSE 帧格式**（`/api/games/:id/stream`）
```
event: game_update
data: {"type":"GOAL","gameEvent":{...},"scoreA":2,"scoreB":1,"elapsedMs":824000}

event: timer_tick
data: {"elapsedMs":830000,"status":"PLAYING"}
```

---

## 5. 鉴权机制（极简版）

### 5.1 设计

- 创建活动时服务端生成两段秘密：
  - `adminToken`：长随机字符串（32 字节 base64url），存 localStorage，写操作使用
  - `adminPin`：6 位数字（明文存 DB），用于"换设备"时拾回（用户手动输入）
- DB 存 `admin_token_hash = sha256(adminToken + pin)`（不可逆，但 pin 在 DB 明文用于换设备校验）
- 写接口校验顺序：
  1. 优先校验 `Authorization: Bearer <token>` → 用 `sha256(token + db.pin)` 比对 `admin_token_hash`
  2. 退化校验 `?pin=XXXXXX` → 直接比对 `db.admin_pin`，校验通过后返回新的 `adminToken` 给前端存

### 5.2 安全说明

> ⚠️ 这是"玩具级"安全设计。明文 PIN 入库、无限速、无审计。仅适用于 §决策 D3 的小圈子场景。任何"对外开放注册"的想法都需要先重做这一节。

---

## 6. 离线同步机制

### 6.1 客户端 outbox

IndexedDB store `outbox`：
```ts
interface OutboxItem {
  id: string;              // uuid v4
  gameId: string;
  endpoint: string;        // 'POST /api/games/xxx/events'
  payload: any;            // 业务 body
  clientTs: number;        // 写入时的客户端 ms
  status: 'PENDING' | 'SENDING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}
```

### 6.2 写流程

```
用户点击 GOAL
  ↓
1. UI optimistically 更新（Zustand store 立即 +1）
  ↓
2. 写入 IndexedDB outbox (status=PENDING)
  ↓
3. 立即触发 worker.flush()（非阻塞）
  ↓
worker.flush():
  - 取所有 PENDING 项，按 clientTs 升序
  - 同一 gameId 的项打包 POST /api/games/:id/events/batch
  - 成功 → 删除 outbox 条目
  - 失败 → status=FAILED, retryCount++（指数退避，最多 5 次）
```

### 6.3 服务端幂等

- 每条事件携带 `clientEventId`（UUID）
- DB 唯一约束 `(game_id, client_event_id)`
- 重复提交 → 服务端检测后返回 200 + 现有记录（视为成功）

### 6.4 冲突说明（v2 假设）

**v2 假设**：同一场比赛**只有一个管理员设备**在录入。其他设备只读。
- 该假设让我们彻底避开 CRDT / OT 的复杂度
- 如果未来 v3 需要多人协同录入，再引入 yjs 或类似方案

### 6.5 时钟纠偏

- 录入时 `clientTs = Date.now() + clientServerOffsetMs`
- `clientServerOffsetMs` 由 `GET /api/time` 校准，每 5 分钟自动重新校准
- 这避免了用户手机时间错乱导致事件顺序混乱

---

## 7. 战报渲染

> 战报与 §8 的 UI 设计令牌**同源**——海报由 satori 渲染 React 组件，组件直接消费 Tailwind 等价的样式表达，确保"分享图 / 在线 H5 / App 内页面"三处视觉完全一致。任何对 §8 设计令牌的修改自动传导到战报。

### 7.1 战报两层

| 层级 | 触发 | 内容 |
|---|---|---|
| **单场战报** | 一场比赛 `FINISHED` 后 | 比分 + 计时 + 进球流水（分队伍）+ 单场 MVP（=进球+助攻最多者，并列取较早出现） |
| **活动战报** | 活动 finish 或 admin 随时分享 | 场次结果列表 + 积分榜 + 射手榜（Top N）+ 助攻榜（Top N）+ 活动 MVP（=活动内总进球+总助攻最多者） |

两层战报均提供：
- H5 只读页面（路由：`/events/:shortCode/report`、`/games/:id/report`）
- PNG 海报（API：`/api/events/:id/poster.png`、`/api/games/:id/poster.png`）

`topN` 由 admin 在"分享活动战报"时通过 query 选择（默认 5、范围 1-20）。前端 UI 提供下拉选择器。

### 7.2 数据派生算法

**积分榜（standings）** — 标准足球规则：

```ts
const POINTS = { win: 3, draw: 1, loss: 0 }

interface TeamStanding {
  teamId: string; teamName: string; colorHex: string;
  played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDiff: number;
  points: number; rank: number;
}

function computeStandings(event): TeamStanding[] {
  const acc = new Map<teamId, TeamStanding>()
  // 初始化每个队伍
  for (team of event.teams) acc.set(team.id, { ...zeroStat, teamId: team.id, ... })

  // 仅统计已结束的场次
  for (game of event.games.filter(g => g.status === 'FINISHED')) {
    const { scoreA, scoreB } = deriveScore(game.events)
    const a = acc.get(game.teamAId)!, b = acc.get(game.teamBId)!
    a.played++; b.played++
    a.goalsFor += scoreA; a.goalsAgainst += scoreB
    b.goalsFor += scoreB; b.goalsAgainst += scoreA
    if (scoreA > scoreB)      { a.wins++;  b.losses++ }
    else if (scoreA < scoreB) { b.wins++;  a.losses++ }
    else                      { a.draws++; b.draws++  }
  }

  // 计算积分与净胜球
  for (s of acc.values()) {
    s.points = s.wins * POINTS.win + s.draws * POINTS.draw
    s.goalDiff = s.goalsFor - s.goalsAgainst
  }

  // 排序：积分 desc → 净胜球 desc → 进球数 desc → 队名 asc
  const sorted = [...acc.values()].sort((x, y) =>
    y.points - x.points
    || y.goalDiff - x.goalDiff
    || y.goalsFor - x.goalsFor
    || x.teamName.localeCompare(y.teamName, 'zh-Hans')
  )
  sorted.forEach((s, i) => s.rank = i + 1)
  return sorted
}
```

**射手榜（top scorers）**：
- 统计所有 `FINISHED` 场次中、未被 `UNDO` 的 `GOAL` 事件
- 按 `scorer_roster_id` group by，count desc
- 同分按"首次进球时间"升序（先进者靠前）
- 关联 `roster.name` + `team.name` + `team.color_hex`
- 截断至 `topN`

**助攻榜（top assists）**：
- 统计所有 `FINISHED` 场次中、未被 `UNDO` 且 `assistant_roster_id` 非空的事件
- 其余同射手榜

**活动 MVP**：
- 每个 roster 计算 `goals + assists` 总分
- 取最高者；并列时优先取首次进球时间更早者

> ⚠️ 排序稳定性约束：同一份事件流多次渲染必须得到相同排序，禁止用 `Map` 迭代顺序作为隐含排序键。

### 7.3 数据契约（API 返回）

**`GET /api/events/:id/report?topN=5`**
```ts
interface EventReport {
  event: { id, shortCode, name, createdAt, finishedAt? }
  games: Array<{
    id, teamA: TeamBrief, teamB: TeamBrief,
    scoreA, scoreB, status, durationMs
  }>
  standings: TeamStanding[]               // §7.2 输出
  topScorers: Array<{
    rosterId, name, teamId, teamName, colorHex,
    goals: number, firstGoalAt: number    // epoch ms，用于排序
  }>
  topAssists: Array<{
    rosterId, name, teamId, teamName, colorHex,
    assists: number, firstAssistAt: number
  }>
  mvp?: { rosterId, name, teamName, colorHex, goals, assists }
  meta: { topN: number, generatedAt: number }
}
```

**`GET /api/games/:id/report`**
```ts
interface GameReport {
  game: { id, eventId, teamA, teamB, scoreA, scoreB,
          startedAt, finishedAt, durationMs, status }
  goals: Array<{                         // 按时间升序
    minute: number,                      // 相对开赛多少分钟
    teamSide: 'A' | 'B',
    scorerName: string,
    assistantName?: string,
    type: 'GOAL' | 'OWN_GOAL'
  }>
  gameMvp?: { rosterId, name, teamName, colorHex, goals, assists }
}
```

### 7.4 渲染管线（服务端 satori）

```ts
// backend/src/services/poster.service.ts
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const fontRegular = fs.readFileSync('./assets/fonts/NotoSansSC-Regular-subset.ttf')
const fontBold    = fs.readFileSync('./assets/fonts/NotoSansSC-Bold-subset.ttf')

export async function renderEventPoster(
  eventId: string, opts: { topN?: number } = {}
): Promise<Buffer> {
  const data = await reportService.buildEvent(eventId, { topN: opts.topN ?? 5 })

  // 长图：根据榜单实际行数动态计算高度
  const height = estimateEventPosterHeight(data)   // 通常 2400-3000

  const svg = await satori(<EventPosterTemplate {...data} />, {
    width: 1080,
    height,
    fonts: [
      { name: 'NotoSC', data: fontRegular, weight: 400 },
      { name: 'NotoSC', data: fontBold,    weight: 700 },
    ],
  })
  return new Resvg(svg, { background: '#ffffff' }).render().asPng()
}

export async function renderGamePoster(gameId: string): Promise<Buffer> {
  const data = await reportService.buildGame(gameId)
  const svg = await satori(<GamePosterTemplate {...data} />, {
    width: 1080,
    height: 1920,
    fonts: [...]
  })
  return new Resvg(svg, { background: '#ffffff' }).render().asPng()
}
```

字体子集化（Phase 0 完成）：
- 使用 [`subset-font`](https://github.com/papandreou/subset-font) 仅保留常用 CJK 子集（GB2312 + 数字 + 字母 + 标点 + emoji 映射）
- Regular + Bold 各约 ~250KB
- 文件位置：`backend/src/assets/fonts/`

### 7.5 模板：活动战报（EventPosterTemplate）

风格 **B · 卡片浅底长图**（已锁定）。版面（自上而下）：

```
┌──────────────────────────────────────┐
│   [Header]                            │
│   🏆  {event.name}                    │
│   {YYYY-MM-DD HH:mm}                  │
└──────────────────────────────────────┘

╭───── [Card] 场次结果 ────────────────╮
│   ▮ TeamA  3                          │
│                              ◀ 胜    │
│   ▮ TeamB  2                          │
│   ─────────────────                   │
│   ...每场一组...                       │
╰───────────────────────────────────────╯

╭───── [Card] 🏅 积分榜 ───────────────╮
│   排名  队伍   场 胜 平 负 净胜 积分   │
│    1   ▮红队   2  2  0  0  +3   6    │
│    ...                                │
╰───────────────────────────────────────╯

╭───── [Card] 👟 射手榜 (Top N) ──────╮
│   1. 陈宇    ▮ 红队        3 球       │
│   ...                                  │
╰───────────────────────────────────────╯

╭───── [Card] 🅰 助攻榜 (Top N) ──────╮
│   1. 陈宇    ▮ 红队        2 助       │
│   ...                                  │
╰───────────────────────────────────────╯

╭───── [Card] ⭐ 活动 MVP ────────────╮
│                                        │
│        陈宇 · 红队 · 3G / 2A           │
│                                        │
╰───────────────────────────────────────╯

   [Footer] PitchMaster · {shortCode}
```

**视觉规则**（与 §8 设计令牌严格对应）：
- 整体背景 `bg-surface`（#ffffff）
- 卡片背景 `bg-elevated`（#f8fafc）+ `rounded-2xl`（16px）+ `shadow-sm`
- 卡片间距 `gap-4`（16px）；卡片内边距 `p-6`（24px）
- 标题字号 `text-lg font-bold`（18/700）；数据行 `text-base tabular-nums`（16）
- 队名前色条：`w-1.5 h-full rounded-full bg-[team.colorHex]`
- 名次徽章：圆形 `w-7 h-7 bg-primary text-white`（前 3 名）/ `bg-slate-200 text-slate-700`（4+）
- "胜/平/负"小标签：`text-xs px-2 py-0.5 rounded-full`，胜 = primary 绿、平 = slate、负 = danger 红

### 7.6 模板：单场战报（GamePosterTemplate）

固定 1080×1920，单页版面：

```
┌──────────────────────────────────────┐
│   PitchMaster                          │
│   {event.name} · 第 {n} 场             │
│   2026-06-18                           │
└──────────────────────────────────────┘

╭───── [Card] 比分 ──────────────────╮
│                                       │
│   ▮ 红队           3   -   2  ▮ 蓝队 │
│                                       │
│         全场 50:00 · 已结束           │
╰───────────────────────────────────────╯

╭───── [Card] ⚽ 进球流水 ───────────╮
│  ▮ 红队                                │
│   12'  陈宇                            │
│   33'  王勇  (助攻: 陈宇)              │
│   47'  陈宇                            │
│  ▮ 蓝队                                │
│   08'  李雷                            │
│   29'  韩梅梅  (助攻: 李雷)            │
╰───────────────────────────────────────╯

╭───── [Card] ⭐ 本场 MVP ───────────╮
│        陈宇 · 红队 · 2G / 1A          │
╰───────────────────────────────────────╯

   [Footer] PitchMaster · {shortCode}
```

视觉规则同 §7.5；进球时间 = `(goal.serverTs - game.startedAt - 暂停期内)` / 60000，向下取整为分钟。

### 7.7 H5 战报页面

H5 复用 satori 模板的同一套 React 组件（`PosterCard`、`StandingsTable`、`ScorerRow` 等），仅在外层容器加 PWA 安全区域、可点击交互（如点击场次跳到 `/games/:id`）和"分享"按钮。

**关键加成（§p6 决策）**：H5 头部固定一个 CTA：`"想下次也来踢吗？→ 进活动主页"`，链接到 `/events/:shortCode`。

---

## 7A. 海报渲染兜底策略

| 风险 | 缓解 |
|---|---|
| satori 不支持某些 CSS 特性（grid、transform 等） | 在 `PosterTemplate` 组件内严格使用 satori 支持的子集（flex、border、border-radius、shadow 简化版）；本地单测 `assets/snapshots/` 比对 PNG |
| 字体文件过大拖累构建 | 子集化到 ≤250KB 单字重；CI 检查字体文件大小 |
| 长图高度估算偏差导致内容被裁切 | `estimateEventPosterHeight()` 取保守值（按最大行数计算），底部留 100px 空白兜底 |
| 海报渲染响应慢 | 后端缓存：activity-level 海报按 `(eventId, topN, lastEventTs)` 缓存 60s；live 活动也能接受 |

---

## 8. 前端关键模块

### 8.1 状态管理（Zustand）

- `useEventStore`：当前活动元数据
- `useGameStore`：当前场次状态 + 事件流（optimistic）
- `useTimerStore`：派生计时（由 game.started_at + clientServerOffset 计算）
- `useOutboxStore`：未同步项数 + flush trigger
- `useNetworkStore`：在线状态（navigator.onLine + 主动探测）

### 8.2 路由

```
/                                          首页（活动列表）
/events/new                                创建活动
/events/:shortCode                         活动主页（公开只读 + 管理操作）
/events/:shortCode/setup                   配置队伍与队员（管理）
/events/:shortCode/report                  战报 H5
/games/new?eventId=...                     新建场次
/games/:id/record                          录入页（管理）
/games/:id                                 场次只读详情
/admin/restore                             凭 PIN 找回 adminToken
```

### 8.3 UI 设计系统（与战报严格同源）

> 本节定义 **唯一一套** 视觉令牌，App 页面、H5 战报、PNG 海报三处都消费它。任何变更必须三处同步。

#### 8.3.1 色板

```js
// web/tailwind.config.js
extend: {
  colors: {
    primary:   '#10b981',   // 翠绿（球场，主操作 / 名次徽章前 3 / 胜利标签）
    primaryDk: '#059669',   // primary 按下/hover
    danger:    '#ef4444',   // 撤销、负标签、错误
    warning:   '#f59e0b',   // 暂停状态
    surface:   '#ffffff',   // 主背景（浅色优先）
    elevated:  '#f8fafc',   // 卡片背景
    border:    '#e2e8f0',   // 分隔线、卡片边框
    textPri:   '#0f172a',   // 主文本
    textSec:   '#64748b',   // 次要文本
    textInv:   '#ffffff',   // 反色文本（按钮上字）
    chipBg:    '#f1f5f9',   // tabular row 斑马底
  },
}
```

> 队伍颜色 `team.color_hex` 由用户在配置队伍时选；预置 8 色调色板：`['#ef4444','#f59e0b','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899']`。

#### 8.3.2 字号 / 字重

```js
fontSize: {
  // 应用层
  'tap':    ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],  // 大按钮（GOAL）
  'score':  ['4rem',    { lineHeight: '1',       fontWeight: '800' }],  // 比分数字

  // 战报海报 / H5 共用
  'h1':     ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 海报顶部活动名
  'h2':     ['1.25rem',  { lineHeight: '1.75rem', fontWeight: '700' }], // 卡片标题
  'body':   ['1rem',     { lineHeight: '1.5rem',  fontWeight: '400' }], // 列表正文
  'caption':['0.75rem',  { lineHeight: '1rem',    fontWeight: '400' }], // 次要说明
},
fontFamily: {
  sans: ['ui-sans-serif', 'system-ui', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
  // 数字对齐：所有数据行加 class="tabular-nums"
},
```

#### 8.3.3 间距 / 圆角 / 阴影

| Token | 值 | 用途 |
|---|---|---|
| `space-card-gap` | 16px (`gap-4`) | 卡片之间 |
| `space-card-padding` | 24px (`p-6`) | 卡片内边距 |
| `space-row-gap` | 8px (`gap-2`) | 行内元素间距 |
| `radius-card` | 16px (`rounded-2xl`) | 所有卡片 |
| `radius-pill` | 9999px (`rounded-full`) | 名次徽章、状态 chip |
| `shadow-card` | `0 1px 3px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.06)` | 卡片浅阴影 |

#### 8.3.4 组件清单（与战报共用，放 `web/src/components/ui/`）

| 组件 | 用途 | 应用页面 | 海报模板 |
|---|---|---|---|
| `Card` | 圆角+阴影容器 | 所有页面 | ✓ |
| `Section` | 卡片内顶部带图标的标题区 | 所有页面 | ✓ |
| `TeamBadge` | 队伍色条 + 队名 | 录入页、详情页 | ✓ |
| `RankBadge` | 名次徽章（1-3 绿色 / 4+ 灰色） | 战报、积分榜 | ✓ |
| `StatusChip` | 胜/平/负 / 暂停/进行中 等小标签 | 录入页、战报 | ✓ |
| `StatRow` | 一行：左侧名次+人名+队伍 / 右侧数字 | 战报榜单 | ✓ |
| `ScoreBoard` | 大比分显示 | 录入页、单场战报 | ✓ |

> 这些组件先开发为 React 组件（应用内），再被 satori 直接复用（仅替换 Tailwind class 为 satori 兼容 inline style）。两边样式由共享的 `tokens.ts` 派生，**不允许任何一处 hardcode 颜色/字号**。

#### 8.3.5 交互硬性规范

- 任何可点击元素最小命中区 ≥ 56×56px（拇指可达性）
- 主操作按钮（GOAL）一律 ≥ 屏宽 80% × 高度 25vh
- 所有数字（比分、积分、统计）必须 `tabular-nums`
- 所有列表带斑马底（奇数行 `bg-chipBg/50`）提升可读性
- 浅色优先，未来如做深色模式必须同时维护两套海报背景

---

## 9. 后端关键模块

### 9.1 Service 切分

- `event.service.ts`：建活动、生成 shortCode/pin、查询
- `game.service.ts`：建场、写事件、计算比分（核心）
- `timer.service.ts`：start/pause/resume/finish + 派生 elapsed
- `outbox.service.ts`：批量幂等写入
- `poster.service.ts`：satori 渲染
- `auth.service.ts`：token/pin 校验

### 9.2 比分派生算法（核心）

```ts
function deriveScore(events: GameEvent[]): {scoreA:number, scoreB:number} {
  // 1. 找出所有被 UNDO 的事件 id
  const undone = new Set(events.filter(e=>e.type==='UNDO').map(e=>e.undoTargetEventId))
  let a=0, b=0
  for (const e of events) {
    if (undone.has(e.id)) continue
    if (e.type==='GOAL') { e.teamSide==='A' ? a++ : b++ }
    if (e.type==='OWN_GOAL') { e.teamSide==='A' ? b++ : a++ }
  }
  return {scoreA:a, scoreB:b}
}
```

### 9.3 SSE Broker

```ts
// in-memory map: gameId → Set<emitter>
const channels = new Map<string, Set<(data:any)=>void>>()

export function subscribe(gameId: string, emit: (d:any)=>void): ()=>void {
  if (!channels.has(gameId)) channels.set(gameId, new Set())
  channels.get(gameId)!.add(emit)
  return () => channels.get(gameId)!.delete(emit)
}

export function broadcast(gameId: string, data: any) {
  channels.get(gameId)?.forEach(emit => emit(data))
}
```

### 9.4 短码生成

- 字母表：`0123456789ABCDEFGHJKMNPQRSTVWXYZ`（去掉易混 I/L/O/U）
- 长度 6 → 32^6 ≈ 10 亿，玩具场景永不冲突
- 创建时 retry on unique violation

---

## 10. 部署架构

### 10.1 服务器最小要求

- 1C / 1G / 20GB SSD（玩具场景充分）
- Ubuntu 22.04 / Alibaba Cloud Linux 3
- 端口：80 / 443

### 10.2 install.sh 关键步骤

```bash
# 1. 装 Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. 装 Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
... (官方步骤略)
apt install caddy

# 3. 部署应用
mkdir -p /opt/pitchmaster-v2
git clone <repo> /opt/pitchmaster-v2
cd /opt/pitchmaster-v2
cd backend && npm ci && npm run build
cd ../web && npm ci && npm run build

# 4. 数据目录
mkdir -p /var/lib/pitchmaster
chown nodeuser:nodeuser /var/lib/pitchmaster

# 5. systemd
cp deploy/systemd/pitchmaster-v2.service /etc/systemd/system/
systemctl enable --now pitchmaster-v2

# 6. Caddy
cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

### 10.3 Caddyfile

```
{$DOMAIN_OR_IP} {
    root * /opt/pitchmaster-v2/web/dist
    encode gzip
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}
```

### 10.4 备份

```bash
# /etc/cron.daily/pitchmaster-backup
#!/bin/bash
DATE=$(date +%Y%m%d)
sqlite3 /var/lib/pitchmaster/data.db ".backup '/var/lib/pitchmaster/backups/data-${DATE}.db'"
find /var/lib/pitchmaster/backups -name "data-*.db" -mtime +30 -delete
```

---

## 11. 测试策略

### 11.1 后端

- **框架**：vitest + better-sqlite3 in-memory
- **必测覆盖**（≥60% 行覆盖 + 100% 关键路径）：
  - `game.service.deriveScore()` 所有事件组合
  - `timer.service` start/pause/resume/finish 边界
  - `outbox.service` 幂等性（同 clientEventId 提交两次）
  - `event.service` shortCode 唯一性
  - `auth.service` token + pin 双路径

### 11.2 前端

- 不做强制单测
- Phase 2 末期手动跑一遍"飞行模式 → 录入 → 恢复网络"剧本，截图存档

---

## 12. 版本与变更日志

每次 schema 或 API 不兼容变更，在此追加一条：

| 日期 | 变更 | 兼容性 | 迁移说明 |
|---|---|---|---|
| 2026-MM-DD | 初版 v2 schema | - | 不与 v1 兼容（v1 数据归档 `legacy/`，不迁移） |
