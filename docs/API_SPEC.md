# API 接口规范 (API Specification)

本项目的 API 遵循 RESTful 风格，所有响应均使用统一的 `Result<T>` 包装格式。

## 1. 通用响应格式
```json
{
  "code": 200,      // 状态码: 200-成功, 401-未登录/认证失败, 403-无权限, 404-资源不存在, 500-系统错误
  "message": "Success",
  "data": { ... }   // 具体的业务数据
}
```

## 2. 认证模块 (Auth)
基础路径: `/auth`

| 接口 | 方法 | 说明 | 参数/Body |
| :--- | :--- | :--- | :--- |
| `/login` | POST | 用户登录 (Shiro) | `username`, `password` (Form-Data) |
| `/register` | POST | 用户注册 | `RegistrationRequest` 对象 (JSON) |
| `/me` | GET | 获取当前登录用户信息 | 返回 `user` 和 `player` 信息 |
| `/logout` | POST | 登出 | 无 |
| `/unauthenticated` | GET | 未认证提示地址 | 无 |

## 3. Tournament 模块
基础路径: `/api/tournament`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取所有活跃 Tournament 列表 | 自动过滤软删除 |
| `/{id}` | GET | 获取 Tournament 详情 | 无 |
| `` | POST | 创建 Tournament | 仅 platform_admin；Body: `Tournament` |
| `/{tournamentId}/admin` | POST | 任命 Tournament 管理员 | 仅 platform_admin；Query: `userId` |
| `/{tournamentId}/admin` | DELETE | 移除 Tournament 管理员 | 仅 platform_admin；Query: `userId` |
| `/{tournamentId}/admins` | GET | 获取管理员列表 | 仅 platform_admin |
| `/{tournamentId}/is-admin` | GET | 判断当前用户是否为管理员 | 无 |
| `/{tournamentId}/join` | POST | 球员加入 Tournament | 无 |
| `/{tournamentId}/leave` | POST | 球员退出 Tournament | 无 |
| `/{tournamentId}/players` | GET | 获取活跃球员列表 | 无 |
| `/{tournamentId}/players/pending` | GET | 获取待审批球员列表 | 需管理员权限 |
| `/{tournamentId}/players/{playerId}/approve` | POST | 审批通过 | 需管理员权限 |
| `/{tournamentId}/players/{playerId}/reject` | POST | 审批拒绝 | 需管理员权限 |
| `/{tournamentId}/players/{playerId}` | POST | 管理员直接添加球员（按 playerId） | 需管理员权限 |
| `/{id}/soft` | DELETE | 软删除 Tournament | 仅 platform_admin；有 ONGOING/PUBLISHED 赛事时拒绝 |
| `/trash` | GET | 获取回收站 Tournament 列表 | 仅 platform_admin |
| `/{id}/restore` | POST | 从回收站恢复 Tournament | 仅 platform_admin |
| `/{id}/permanent` | DELETE | 物理删除 Tournament 及全部关联数据（不可恢复） | 仅 platform_admin；仅限已软删除的 Tournament |
| `/{tournamentId}/members` | GET | 获取成员列表（ACTIVE/PENDING） | 需 tournament admin 权限 |
| `/{tournamentId}/members/batch` | POST | 批量添加用户为成员（按 userId 列表） | 需 tournament admin 权限；Body: `{ "userIds": [1,2,3] }`；返回跳过项说明 |
| `/{tournamentId}/members/{userId}` | DELETE | 移除 Tournament 成员（按 userId） | 需 tournament admin 权限 |

## 4. 赛事管理模块 (Match Event)
基础路径: `/api/match`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取待开赛赛事列表 | 无 |
| `/{id}` | GET | 获取赛事详情 | 无 |
| `/publish` | POST | 创建赛事草稿 | 需 ADMIN 角色，Body: `Match` |
| `/{id}` | PUT | 更新赛事信息 | 仅限 PREPARING 状态，需 ADMIN 角色，Body: `Match` |
| `/{id}/publish` | POST | 发布赛事并开始报名 | 状态由 PREPARING 变为 PUBLISHED |
| `/{id}/revert-preparing` | POST | 撤回至筹备阶段 | 仅限从 PUBLISHED 撤回，需 ADMIN 角色 |
| `/{matchId}/register` | POST | 球员报名 | Query: `playerId` |
| `/{matchId}/cancel` | POST | 取消报名 | 处理 Late Cancellation 逻辑 |
| `/{tournamentId}/admin` | POST | 任命 Tournament 管理员（仅平台管理员） | Query: `userId` |
| `/{tournamentId}/admin` | DELETE | 移除 Tournament 管理员（仅平台管理员） | Query: `userId` |
| `/{tournamentId}/admins` | GET | 获取该 Tournament 当前管理员列表（仅平台管理员） | 返回 `List<User>`（脱敏，无 password/salt） |
| `/{id}/pending` | GET | 获取待审批报名列表 | 返回 PENDING 状态的报名记录 |
| `/{matchId}/eligible-players` | GET | 获取可添加球员列表 | 需 ADMIN，返回当前 tournament 下未报名此赛事的活跃球员 |
| `/{matchId}/admin/add-player` | POST | 管理员强制添加球员 | 需 ADMIN，Query: `playerId`；绕过容量限制，直接设为 REGISTERED；仅允许 PUBLISHED 或 REGISTRATION_CLOSED 状态 |
| `/{matchId}/group` | POST | 触发自动分组算法 | 需 ADMIN，Body: `GroupingRequest`；返回 `GroupsVO` |
| `/{matchId}/groups` | GET | 获取分组数据 | 非管理员仅返回已发布分组；返回 `GroupsVO`（含 `teamNames`） |
| `/{matchId}/groups` | PUT | 手动调整分组草稿 | 需 ADMIN，Body: `Map<Integer, List<Long>>` |
| `/{matchId}/groups/publish` | POST | 发布分组（对所有人可见） | 需 ADMIN，要求全员已分配 |
| `/{matchId}/teams/{groupIndex}/name` | PUT | 更新队伍自定义名称 | 需 ADMIN，Body: `{"name": "雄鹰队"}`；名称为空则重置 |
| `/{matchId}/start` | POST | 确认分组并正式开赛 | 需 ADMIN，要求 `groups_published=true`，Body: `{"actualStartTime": "2026-03-22T19:00:00"}`；执行开赛前置检测 |
| `/{matchId}/rollback` | POST | 回退赛事状态 | 需 ADMIN，仅允许从 ONGOING 回退，Query: `targetStatus`（REGISTRATION_CLOSED） |
| `/{matchId}/actual-start-time` | PUT | 修改实际开赛时间 | 需 ADMIN，仅在 ONGOING 状态，Body: `{"actualStartTime": "2026-03-22T20:00:00"}` |
| `/{matchId}/finish` | POST | 完成赛事 | 将赛事置为 `MATCH_FINISHED` |
| `/{matchId}/settlement` | POST | 保存并发布结算信息 | 需 ADMIN，Body: `SettlementRequest` |
| `/{matchId}/soft` | DELETE | 软删除赛事 | 需 ADMIN，任何状态均可删除，软删除后进入回收站 |
| `/trash` | GET | 获取回收站赛事列表 | 需 ADMIN，返回所有已软删除的赛事 |
| `/{matchId}/permanent` | DELETE | 物理删除赛事 | 需 ADMIN，彻底删除赛事及所有关联数据（不可恢复） |
| `/{matchId}/restore` | POST | 恢复软删除的赛事 | 需 ADMIN，从回收站恢复赛事 |
| `/{id}/registrations` | GET | 获取计费报名列表 | 返回所有需分摊费用的报名信息 |
| `/{id}/payment` | POST | 更新缴费状态 | Query: `playerId`, `status` |
| `/{matchId}/report` | GET | 获取战报导出 | 返回战报内容 (Text/Json) |
| `/{matchId}/standings` | GET | 获取积分榜 | 无需登录；基于 `gameFormat` 计算，返回 `StandingsVO` |
| `/{matchId}/stats` | GET | 获取数据榜（射手/助攻） | 无需登录；返回 `MatchStatsVO` |

## 4. 比赛场次与进球模块 (Match Game)
基础路径: `/api/game`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取赛事下的所有场次 | Query: `matchId` |
| `/{gameId}/start` | POST | 标记单场比赛开始 | Query: `durationMinutes` |
| `/{gameId}/overtime` | POST | 增加加时时间 | Query: `extraMinutes` |
| `/goal` | POST | 录入进球/助攻/乌龙 | Body: `MatchGoal` |
| `/{gameId}/score` | POST | 手动修正比分 | Query: `scoreA`, `scoreB` |
| `/{gameId}/finish` | POST | 标记单场比赛结束 | 状态变更为 FINISHED |
| `/{gameId}/lock` | POST | 获取比分修改锁 | 冲突返回 409 |
| `/{gameId}/unlock` | POST | 释放修改锁 | 无 |
| `/{gameId}/logs` | GET | 获取比分变更审计日志 | 按时间倒序返回 |

## 5. 球员与评分模块 (Player & Rating)
基础路径: `/api`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/player/{id}` | GET | 获取球员档案 | 基本信息 |
| `/player/{id}/rating` | GET | 获取球员在指定赛事的评分档案 | Query: `tournamentId`（必填）；总分实时计算，返回三维评分 + 统计信息 |
| `/player/profile` | POST | 更新个人基础资料 | Body: `ProfileUpdateRequest` |
| `/admin/player/{playerId}/rating/dimension` | POST | 管理员修正三维评分 | Query: `tournamentId`, `dimension` (SKILL/PERFORMANCE/ENGAGEMENT), `newValue` (1.00-20.00), `reason`；需 ADMIN 角色 |
| `/rating/submit` | POST | 提交球员互评/打分 | Body: `PlayerMutualRating`, Optional Query: `quickTotalScore` |
| `/rating/mvp-votes/{matchId}` | GET | 获取 MVP 票数统计 | 返回 Map<PlayerId, VoteCount> |
| `/rating/finalize-mvp/{matchId}` | POST | 最终确定本场 MVP | 需 ADMIN 角色，Optional Query: `manualPlayerId` |

## 6. 平台管理员 (Admin)
基础路径: `/api/admin`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/users/search` | GET | 按用户名或真实姓名模糊搜索全平台用户 | 仅 platform admin；Query: `q`（关键词，必填）；最多返回 20 条；脱敏返回 |

## 7. 参赛统计 (Game Participant)
基础路径: `/api/game-participant`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list/{gameId}` | GET | 获取单场比赛所有参与者数据 | 进球数、红黄牌等 |
| `/batch-update` | POST | 批量更新参与者统计数据 | 需 ADMIN 角色，Body: `List<GameParticipant>` |

## 8. 实时通信 (Real-time)
基础路径: `/api/realtime`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/subscribe/{matchId}` | GET | 订阅赛事比分实时更新 | SSE 协议，推送 `MatchGame` 或 `MatchScoreLog` |

## 9. 关键模型定义 (Key Models)

### RegistrationRequest
```json
{
  "username": "账号",
  "password": "密码",
  "realName": "真实姓名",
  "nickname": "球场昵称",
  "position": "位置 (GK, DF, MF, FW)",
  "age": 30,
  "preferredFoot": "擅长脚 (LEFT, RIGHT, BOTH)",
  "tournamentId": 1,
  "clubId": 1
}
```

### PlayerMutualRating
```json
{
  "matchId": 1,
  "fromPlayerId": 101,
  "toPlayerId": 102,
  "scoreSkill": 5.0,
  "scoreAttitude": 5.0,
  "isMvp": true,
  "comment": "Nice game!"
}
```

### Match
- `status`: 
    - `PREPARING`: 草稿/准备中 (对应 `/publish` 创建后)
    - `PUBLISHED`: 已发布/报名中 (对应 `/{id}/publish` 调用后)
    - `REGISTRATION_CLOSED`: 报名截止
    - `ONGOING`: 比赛进行中
    - `MATCH_FINISHED`: 所有场次结束
    - `CANCELLED`: 已取消
- `numGroups`: 分组数量
- `playersPerGroup`: 每组人数限制
- `registrationDeadline`: 报名截止时间
- `cancelDeadline`: 不可取消时间 (在该时间后取消报名需补缴费用)
- `totalCost`: 场地总费用
- `perPersonCost`: 人均分摊费用 (结算后由系统自动计算或管理员修正)

### MatchGame
- `status`: `READY`, `PLAYING`, `FINISHED`
- `lockUserId`: 当前正在编辑比分的用户ID (实现悲观锁，防止多人同时修改)
- `lockTime`: 锁定开始时间
