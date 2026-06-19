# PitchMaster v2

> **一个让球场边一个人用一部手机，10 秒内开始一场比赛、5 秒内记下一个进球、活动结束自动出战报的工具。**

PitchMaster v2 是为业余足球小圈子（自己 + 朋友 1-2 个俱乐部，<50 人）设计的"现场实战记录器"。
极简、移动优先、断网可用、零账号注册。

> ⚠️ v1（Spring Boot + MySQL + FM 评分）已于 2026-06 推倒重做。v1 完整归档在 [`legacy/`](./legacy/) 仅供参考，不再维护。

---

## 核心特性

- **零账号** · 创建活动即获 6 位分享码 + 管理员令牌（本机存）
- **快速录入** · 大按钮、单手操作、3 步内完成任何动作
- **服务器权威计时** · 多端看到同一个时间
- **离线可用** · 球场 Wi-Fi 烂也照样记录，联网自动同步
- **一键战报** · 活动结束 3 秒内出图片海报 + 只读 H5 链接

---

## 技术栈（v2）

| 层 | 选型 |
|---|---|
| 后端 | Node 20 + TypeScript + Hono + Drizzle + SQLite |
| 前端 | React 18 + Vite + Tailwind + Radix UI + Zustand + PWA |
| 实时 | SSE |
| 部署 | systemd + Caddy（自动 HTTPS） |

> 详细架构见 [`docs/ARCHITECTURE_V2.md`](./docs/ARCHITECTURE_V2.md)

---

## 快速上手（本地）

```bash
nvm use            # 读取 .nvmrc (Node 20)
bash bin/dev.sh    # 一键启动 backend(:3000) + web(:5173)
```

浏览器打开 <http://localhost:5173>，进入首页新建或加入活动。

或分别启动：

```bash
(cd backend && npm install && npm run dev)   # → :3000/api/health
(cd web     && npm install && npm run dev)   # → :5173
```

---

## 仓库结构

```
/
├── AGENTS.md                 # AI 编码代理上下文（唯一）
├── DEVELOPMENT_PLAN.md       # 当前开发路线 + 阶段计划 + 验收门禁
├── README.md                 # 本文件
├── .nvmrc                    # Node 20
├── bin/dev.sh                # 一键启动两端
├── docs/
│   ├── ARCHITECTURE_V2.md    # 技术蓝图（DDL / API / 算法）
│   ├── DECISIONS.md          # ADR 决策记录
│   ├── DEPLOYMENT.md         # ECS 部署与 GitHub Actions
│   └── issues-tracking.md    # Phase 3 内测问题跟踪
├── legacy/                   # v1 归档（已废弃）
├── backend/                  # v2 Node + Hono 后端
├── web/                      # v2 React + Vite PWA 前端
└── deploy/                   # systemd / Nginx / GitHub Actions 部署脚本
```

---

## 当前进度

参见 [`DEVELOPMENT_PLAN.md §5 阶段实施日志`](./DEVELOPMENT_PLAN.md#5-阶段实施日志执行时由开发者追加)。

| 阶段 | 状态 | 说明 |
|---|---|---|
| Phase 0 | ✅ 完成 | v1 归档、脚手架、ECS 部署链路（ADR-0007） |
| Phase 1 | ✅ 完成 | MVP 在线版：建活动 → 配队 → 开赛 → 记进球 → SSE 观战 |
| Phase 2 | ✅ 完成 | 离线 outbox + batch replay + 战报 H5/海报 + PWA 增强 + 分享（PR #6） |
| UI 视觉升级 | 🚧 PR 链 | Notion-体育 minimalist 四阶段（token / 海报 4:5 / H5 战报 / App UI），见 PR #7–#12 |
| Phase 3 | 🟡 部分 | 自动部署 + healthz + 备份/恢复演练 ✅；HTTPS 暂缓；内测 Gate 待启动 |
| Phase 4 | ⬜ 待定 | Apple Watch（可选） |

**线上**：`http://8.153.145.81/`（HTTP，ECS + Nginx 反代 backend:3000）

---

## 给 AI 编码代理的说明

请先读 [`AGENTS.md`](./AGENTS.md)，特别是 §8 红线清单。

---

## License

MIT
