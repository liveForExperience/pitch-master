# pitchmaster-backend

PitchMaster v2 后端 — **Hono on Node 20**, **SQLite (WAL)**, **Drizzle ORM**, **satori + resvg** 海报渲染。

详细架构见 [`../docs/ARCHITECTURE_V2.md`](../docs/ARCHITECTURE_V2.md)。

## Quick start

```bash
npm install          # 建议在仓库根目录 npm install（workspaces）
cp .env.example .env # 可选：覆盖 PORT / DB_FILE
npm run dev          # tsx watch → http://localhost:3000/api/health
```

## Scripts

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发模式（tsx watch） |
| `npm run build` | TypeScript 编译 + 复制 migrations 与 assets 到 `dist/` |
| `npm start` | 生产模式（`node dist/index.js`） |
| `npm test` | vitest（含 report / poster / outbox / timer 等） |
| `npm run test:watch` | 监听模式 |
| `npm run typecheck` | 仅类型检查 |
| `npm run fonts` | 生成 NotoSC + Geist Mono + Newsreader 字体子集 |
| `npm run db:gen` | drizzle-kit generate |
| `npm run db:migrate` | 应用迁移 |

## Layout

```
backend/
├── scripts/
│   ├── prepare-fonts.mjs   # 字体子集（≤500KB 总预算）
│   └── preview-poster.mjs  # 本地海报预览（dev 工具）
├── src/
│   ├── index.ts            # 进程入口
│   ├── app.ts              # Hono 路由组装
│   ├── routes/             # events / games / poster / health …
│   ├── services/           # 业务逻辑（game / report / poster / outbox …）
│   ├── poster/             # satori 模板 + layout 原语 + tokens
│   ├── db/                 # Drizzle schema + migrations
│   ├── lib/                # auth、sse-broker、poster-cache、assets …
│   └── assets/fonts/       # 子集 woff（构建时复制到 dist/assets/fonts/）
└── tests/
```

## 海报渲染

- 画布：**1080×1350**（4:5）；活动数据过多时最高 **1620**
- 字体：静态 NotoSC 子集 + 运行时 **PosterCJK** 动态子集（队名/球员名）+ Geist Mono + Newsreader Italic
- 缓存 key：`v2:{eventId}:5:{lastEventTs}`（内存 60s）
- 预览：`npx tsx scripts/preview-poster.mjs`

## 当前能力

- ✅ REST API + Bearer/PIN 鉴权
- ✅ SSE 实时推送
- ✅ 离线 batch replay（幂等 `clientEventId`）
- ✅ 战报派生（积分榜 / Top 5 射手助攻 / MVP）
- ✅ PNG 海报 API
- ✅ vitest 行覆盖 ≥60%（核心 service）
