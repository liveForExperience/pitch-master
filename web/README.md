# pitchmaster-web

PitchMaster v2 frontend — **React 18 + Vite + TypeScript + Tailwind + Zustand**（PWA 钩子在 Phase 2 接入）。

详细架构见 [`../docs/ARCHITECTURE_V2.md`](../docs/ARCHITECTURE_V2.md)。

## Quick start

```bash
# 先确保 backend 在 :3000 上跑
cd ../backend && npm run dev    # 另一个终端
# 回到 web/
npm install
npm run dev                     # → http://localhost:5173
```

Vite dev server 已配置 `/api/*` 反代到 `http://localhost:3000`（可被 `VITE_BACKEND_URL` 覆盖）。

## Scripts

| 命令 | 用途 |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | 类型检查 + 产线打包到 `dist/` |
| `npm run preview` | 预览打包产物 |
| `npm run typecheck` | 仅类型检查 |

## Layout（脚手架阶段）

```
web/
├── index.html
├── src/
│   ├── main.tsx            # ReactDOM 入口
│   ├── App.tsx             # 当前为后端健康检查展示页
│   ├── index.css           # tailwind base
│   └── api/
│       └── health.ts       # fetch /api/health
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts          # /api 反代到 :3000
```

## 当前状态

Phase 0 · T0.4 脚手架 —— 已就绪：
- ✅ Vite + React + TS 启动
- ✅ Tailwind 主题（pitch.* 颜色系）落位
- ✅ `/api/*` 反代到 backend
- ✅ 首屏调用 `GET /api/health` 渲染结果

待开工（Phase 1+）：路由、Zustand 状态、组件库、IndexedDB outbox、SSE 订阅、PWA manifest/Service Worker。
