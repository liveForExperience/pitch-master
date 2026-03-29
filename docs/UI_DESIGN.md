# UI 设计与前端架构方案 (UI Design & Frontend Architecture)

本项目的移动端优先前端位于 `frontend/` 目录下，作为单仓（Monorepo）的一部分，与后端代码共享业务模型。

## 1. 技术栈 (Tech Stack)
*   **框架**: React 18 (Hooks)
*   **构建工具**: Vite
*   **语言**: TypeScript (类型安全，对齐后端模型)
*   **UI 库**: 
    *   **Ant Design Mobile**: 移动端核心交互（TabBar, List, ActionSheet, Toast）。
    *   **Ant Design (Web)**: 用于复杂的管理后台界面（Table, Form）。
*   **样式管理**: Tailwind CSS (足球运动风格，自定义主色: `#1DB954`)。
*   **状态管理**: Zustand (简洁的状态流转)。
*   **网络库**: Axios (配置 `withCredentials: true` 以支持 Shiro Session)。
*   **可视化**: ECharts (球员能力雷达图、历史战绩)。

## 2. 视觉风格 (Visual Identity)
*   **核心色调**: 
    *   主色: 足球场绿 (#1DB954)
    *   深背景色: 深灰/黑 (#121212)
    *   文字色: 白色/浅灰
*   **设计原则**: 高对比度、大点击区域（适配运动场景）、卡片式布局。

## 3. 页面拓扑与功能 (Page Sitemap)

### A. 球员视角 (Player Views)
1.  **登录/注册 (`/login`)**: 基于 Shiro 的身份验证。
2.  **赛事中心 (`/match`)**: 列表展示近期赛事，卡片显示地点、报名状态。
3.  **赛事详情 (`/match/:id`)**: 
    *   **报名**: 一键报名/取消。
    *   **分组看板**: 实时展示 A/B 队名单。
    *   **实况**: 进球流与实时比分。
4.  **个人中心 (`/profile`)**: 
    *   **能力雷达图**: ECharts 实现的技术评分展示。
    *   **战绩统计**: 进球数、助攻数、MVP 次数。

### B. 管理员视角 (Admin Views - 权限校验)
1.  **管理后台 (`/admin`)**: 赛事列表管理。
2.  **发布赛事**: 设置人数限制、费用、截止时间。
3.  **分组控制台**: 调用自动分组算法，支持**手动拖拽微调**。
4.  **比赛执行**: 
    *   **编辑互斥**: 进入录入界面前需调用 `/lock` 获取锁。
    *   **实时录入**: 实时录入进球、助攻球员，增加加时。
    *   **保存释放**: 提交最终比分后自动解锁。

## 4. 前端目录结构
```text
frontend/
├── src/
│   ├── api/          # 封装 Axios，对接 docs/API_SPEC.md
│   ├── components/   # PlayerCard, ScoreBoard, GoalListItem
│   ├── hooks/        # useAuth, useMatch
│   ├── layouts/      # 底部 TabBar 布局
│   ├── pages/        # 业务页面组件
│   ├── store/        # Zustand Stores
│   └── theme/        # AntD Mobile 定制
```

## 5. 跨域与认证 (CORS & Auth)
*   **Proxy**: Vite 开发服务器代理 `/auth` 和 `/api` 到 `8080` 端口。
*   **Credentials**: Axios 默认开启 `withCredentials`，确保 Cookie 随请求发送。
