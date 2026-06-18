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

## 仓库结构

```
/
├── AGENTS.md                 # AI 编码代理上下文（唯一）
├── DEVELOPMENT_PLAN.md       # 当前开发路线 + 阶段计划 + 验收门禁
├── README.md                 # 本文件
├── docs/
│   ├── ARCHITECTURE_V2.md    # 技术蓝图（DDL / API / 算法）
│   └── DECISIONS.md          # ADR 决策记录
├── legacy/                   # v1 归档（已废弃）
├── backend/                  # v2 Node + Hono 后端（Phase 0 后创建）
├── web/                      # v2 React + Vite PWA 前端（Phase 0 后创建）
└── deploy/                   # v2 部署脚本（Phase 0 后创建）
```

---

## 当前进度

参见 [`DEVELOPMENT_PLAN.md §5 阶段实施日志`](./DEVELOPMENT_PLAN.md#5-阶段实施日志执行时由开发者追加)。

- [x] Phase 0：v1 归档完成、新文档体系建立
- [ ] Phase 0：v2 backend/web 脚手架（待启动）
- [ ] Phase 1：MVP 在线版（待启动）
- [ ] Phase 2：离线 + 战报（待启动）
- [ ] Phase 3：上线（待启动）
- [ ] Phase 4：Apple Watch（可选，待启动）

---

## 给 AI 编码代理的说明

请先读 [`AGENTS.md`](./AGENTS.md)，特别是 §8 红线清单。

---

## License

MIT
