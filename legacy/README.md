# Legacy (v1) · 已废弃归档

> **状态**：本目录是 PitchMaster v1（Spring Boot + MySQL + React + AntD Mobile + FM 评分）的完整归档，**已于 2026-06 推倒重做**。
> **请勿**基于本目录内的代码做任何 v2 设计或实现决策。

## 为什么 v1 被推倒？

参见 `docs/DECISIONS.md` 的 `ADR-0001 · 推倒重做 v1`。简短版：

1. **真实赛场不好用** —— 单手操作、计时、快速记录这些核心需求都没解决
2. **架构腐烂迹象明显** —— God Class（MatchServiceImpl 1025 行）、重复同名接口、双写一致性隐患
3. **测试覆盖近似零** —— 102 个 Java 文件仅 4 个测试
4. **多租户隔离形同虚设** —— 文档写了"tournament_id 是顶层隔离键"，实现里没有 AOP/拦截器自动过滤，存在越权风险
5. **三套 AI 上下文文档互相不同步** —— `GEMINI.md` / `.windsurfrules` / `docs/`

## 目录结构

```
legacy/
├── README.md              # 本文件
├── backend/               # 原 src/main, src/test (102 Java)
├── frontend/              # 原 frontend/（React + Vite + AntD Mobile）
├── docs-v1/               # 原 docs/（5 篇 v1 设计文档）
├── deploy-v1/             # 原 deploy/（systemd + Nginx + ECS 脚本）
└── pom.xml                # 原 Maven 配置
```

## 如何独立 checkout v1（仅备查）

```bash
git checkout legacy/v1-final
```

切回 v2：

```bash
git checkout main   # 或当前 v2 主分支
```

## 不要在 v2 引用 v1 代码

`AGENTS.md §8 红线清单`明确禁止 v2 代码引用 v1。如有"看起来能复用"的诱惑，请先思考：v2 的设计语义可能完全不同（极简、单管理员、SQLite、Hono、PWA），引用 v1 实现通常意味着把 v1 的复杂度也带过来。
