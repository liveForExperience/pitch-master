# TournamentList 前端映射对照（Tournament Mapping）

本文档用于统一维护 `TournamentList` 页面文案与后端接口字段 / 数据库字段的映射关系。

适用页面：`frontend/src/pages/TournamentList.tsx`

---

## 1. 数据链路总览

1. 前端调用：`GET /api/tournament/list`
2. 后端入口：`TournamentController.list()`
3. 业务查询：`TournamentServiceImpl.listActive()`（查询 `status=1`）
4. 返回实体：`Tournament`（映射 `tournament` 表）
5. 前端渲染：`TournamentList` 卡片文案与按钮

---

## 2. 字段与文案映射（核心）

| 页面展示位置 | 页面文案示例 | 前端取值逻辑 | API 字段 | DB 字段 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 卡片标题 | 老男孩俱乐部公开赛 | `t.name` | `name` | `tournament.name` | 直接展示数据库值 |
| 卡片副标题 | 默认基础赛事 | `t.description` | `description` | `tournament.description` | 直接展示数据库值 |
| 加入方式标签 | 自由加入 | `t.joinMode === 'OPEN' ? '自由加入' : '需审批'` | `joinMode` | `tournament.join_mode` | 前端映射文案，不是数据库直接存“自由加入” |
| 加入按钮文案 | 加入赛事 | `t.joinMode === 'OPEN' ? '加入赛事' : '申请加入'` | `joinMode` | `tournament.join_mode` | 与加入方式标签保持一致 |
| 加入按钮文案（审批） | 申请加入 | `t.joinMode === 'OPEN' ? '加入赛事' : '申请加入'` | `joinMode` | `tournament.join_mode` | 审批制入口 |
| 已加入入口按钮 | 进入赛事中心 | 静态文案：`进入赛事中心` | - | - | 仅对 `isJoined=true` 展示，用于进入 `MatchList` |
| 人数上限标签 | 上限 N 人 | `t.maxPlayers && '上限 ${t.maxPlayers} 人'` | `maxPlayers` | `tournament.max_players` | 仅字段有值时展示 |

---

## 3. 默认初始化数据来源

以下展示文案来自初始化 Migration：

- `name = '老男孩俱乐部公开赛'`
- `description = '默认基础赛事'`

来源：`src/main/resources/db/migration/V4__initial_admin_data.sql`

`join_mode` 字段默认值为 `OPEN`，因此页面会显示“自由加入”。
来源：`src/main/resources/db/migration/V14__platform_concept_and_player_split.sql`

---

## 4. 维护约束（强制）

凡是涉及以下任一改动，必须同步更新本文件：

1. `TournamentList` 页面文案、展示规则、按钮规则改动
2. `frontend/src/api/tournament.ts` 中 `Tournament` 类型字段改动
3. 后端 `Tournament` 实体字段改动（含命名、语义、默认值）
4. `tournament` 表结构或默认值改动（如 `join_mode`、`max_players`）
5. `/api/tournament/list` 返回结构改动

若改动中出现以下关键词，可视为必须更新本文档：

- `name`
- `description`
- `joinMode` / `join_mode`
- `maxPlayers` / `max_players`
- `TournamentList`
- `tournamentApi.list`

---

## 5. 变更自检清单（提交前）

- 页面展示文案与字段映射是否仍一致
- `OPEN/APPROVAL` 的前端文案映射是否符合预期
- API 类型定义与后端实体字段是否一致
- 本文档是否已同步更新

---

## 6. 参考代码位置

- 前端页面：`frontend/src/pages/TournamentList.tsx`
- 前端 API：`frontend/src/api/tournament.ts`
- 后端控制器：`src/main/java/com/bottomlord/controller/TournamentController.java`
- 后端服务：`src/main/java/com/bottomlord/service/impl/TournamentServiceImpl.java`
- 后端实体：`src/main/java/com/bottomlord/entity/Tournament.java`
- 初始化数据：`src/main/resources/db/migration/V4__initial_admin_data.sql`
- 字段增强：`src/main/resources/db/migration/V14__platform_concept_and_player_split.sql`
