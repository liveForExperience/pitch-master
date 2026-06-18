# pitchmaster-backend

PitchMaster v2 backend — **Hono on Node 20**, **SQLite**, **Drizzle ORM**.

详细架构见 [`../docs/ARCHITECTURE_V2.md`](../docs/ARCHITECTURE_V2.md)。

## Quick start

```bash
npm install
cp .env.example .env       # 可选：覆盖默认 PORT/HOST
npm run dev                # tsx watch，热重载
# → http://localhost:3000/api/health
```

## Scripts

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发模式（tsx watch） |
| `npm run build` | TypeScript 编译到 `dist/` |
| `npm start` | 生产模式（node dist/index.js） |
| `npm test` | 跑一次 vitest |
| `npm run test:watch` | 监听模式 |
| `npm run typecheck` | 仅类型检查不输出 |

## Layout

```
backend/
├── src/
│   ├── index.ts          # 进程入口（serve 启动）
│   ├── app.ts            # Hono 实例与路由组装
│   ├── routes/           # 路由（按资源拆分）
│   ├── services/         # 业务逻辑（后续阶段）
│   ├── db/               # Drizzle schema + 迁移（后续阶段）
│   ├── lib/              # 共享工具（auth / sse-broker 等，后续阶段）
│   └── assets/           # 字体等静态资源（后续阶段）
└── tests/
```

## 当前状态

Phase 0 · T0.4 脚手架 —— 已就绪：
- ✅ Hono + @hono/node-server 启动
- ✅ `GET /api/health` 返回 `{status:"ok",...}`
- ✅ vitest 测试通过

待开工（Phase 1+）：Drizzle schema / 业务路由 / SSE / 海报渲染 / 离线 outbox / 服务端时钟。
