# pitchmaster-web

PitchMaster v2 前端 — **React 18 + Vite + TypeScript + Tailwind + Zustand + PWA**（`injectManifest` 自定义 Service Worker）。

详细架构见 [`../docs/ARCHITECTURE_V2.md`](../docs/ARCHITECTURE_V2.md) §8。

## Quick start

```bash
# 推荐：在仓库根目录一键启动 backend + web
cd .. && bash bin/dev.sh

# 或分别启动
cd ../backend && npm run dev    # → :3000
cd ../web && npm install && npm run dev   # → :5173
```

Vite dev server 将 `/api/*` 反代到 `http://localhost:3000`（可用 `VITE_BACKEND_URL` 覆盖）。

## Scripts

| 命令 | 用途 |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | 类型检查 + 产线打包到 `dist/`（含 PWA SW） |
| `npm run preview` | 预览打包产物 |
| `npm run typecheck` | 仅类型检查 |
| `npm test` | vitest 单元测试 |

## Layout

```
web/
├── public/
│   ├── fonts/              # Geist Mono + Newsreader 子集（self-host）
│   └── offline.html        # PWA 离线兜底页
├── src/
│   ├── main.tsx
│   ├── App.tsx             # react-router 路由
│   ├── sw.ts               # 自定义 SW（injectManifest，独立编译）
│   ├── index.css           # Tailwind + @font-face
│   ├── api/                # fetch 封装 + 类型
│   ├── components/
│   │   ├── ui/             # Card、ScoreBoard、TeamBadge 等
│   │   ├── report/         # 战报 H5 + ReportHero + hairline layout
│   │   ├── OutboxSync.tsx  # 离线 outbox 同步
│   │   └── OfflineStatusBar.tsx
│   ├── lib/
│   │   ├── tokens.ts       # 设计令牌（与 backend poster/tokens 同步）
│   │   ├── uuid.ts         # randomUUID 兼容 HTTP / WebView
│   │   └── outbox/         # IndexedDB 队列 + flush
│   ├── pages/              # Home / Event / GameRecord / Report 等
│   └── stores/             # Zustand（network、outbox）
├── tailwind.config.ts
└── vite.config.ts
```

## 设计系统（2026-06 UI 升级）

视觉语言：**Notion-体育 minimalist**（见 `src/lib/tokens.ts` + `tailwind.config.ts`）

- 主色 `#2E7D5B`（球场墨绿），暖白背景，hairline 分隔（`#EAEAEA`），静态无阴影
- 数字：`font-mono`（Geist Mono）；战报 Hero 点缀：`font-serif`（Newsreader Italic）
- 图标：`@phosphor-icons/react`（已移除 emoji）
- 战报页：`components/report/layout.tsx` 四段式布局（Hero / 表格 / zigzag 双栏 / 横滚场次）

## 当前能力

- ✅ 完整录入流程（建活动 → 配队 → 开赛 → 记进球/助攻/撤销）
- ✅ SSE 实时观战 + 赛后修正
- ✅ IndexedDB outbox + 联网 batch replay
- ✅ PWA 离线兜底 + Background Sync + 网络探测条
- ✅ 战报 H5 + 分享（Web Share / 剪贴板 fallback）
- ✅ 海报预览（点击分享）
