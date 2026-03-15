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

## 3. 赛事管理模块 (Match Event)
基础路径: `/api/match`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取待开赛赛事列表 | 无 |
| `/{id}` | GET | 获取赛事详情 | 无 |
| `/publish` | POST | 创建赛事草稿 | 需 ADMIN 角色，Body: `Match` |
| `/{id}/publish` | POST | 发布赛事并开始报名 | 状态由 PREPARING 变为 PUBLISHED |
| `/{id}/revert-preparing` | POST | 撤回至筹备阶段 | 仅限从 PUBLISHED 撤回，需 ADMIN 角色 |
| `/{matchId}/register` | POST | 球员报名 | Query: `playerId` |
| `/{matchId}/cancel` | POST | 取消报名 | 处理 Late Cancellation 逻辑 |
| `/{matchId}/group` | POST | 触发自动分组算法 | 返回 Map<GroupIndex, List<PlayerId>> |
| `/{matchId}/start-with-groups` | POST | 确认分组并正式开赛 | Body: `Map<GroupIndex, List<Long>>` |
| `/{matchId}/finish` | POST | 完成赛事并结算费用 | 触发 perPersonCost 计算 |
| `/{id}/registrations` | GET | 获取计费报名列表 | 返回所有需分摊费用的报名信息 |
| `/{id}/payment` | POST | 更新缴费状态 | Query: `playerId`, `status` |
| `/{matchId}/report` | GET | 获取战报导出 | 返回战报内容 (Text/Json) |

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
| `/player/{id}` | GET | 获取球员档案 | 基本信息、统计数据等 |
| `/player/{id}/rating` | POST | 管理员手动修正评分 | Body: `newRating`, `reason` |
| `/rating/submit` | POST | 提交球员互评/打分 | Body: `PlayerMutualRating`, Optional Query: `quickTotalScore` |
| `/rating/mvp-votes/{matchId}` | GET | 获取 MVP 票数统计 | 返回 Map<PlayerId, VoteCount> |
| `/rating/finalize-mvp/{matchId}` | POST | 最终确定本场 MVP | 需 ADMIN 角色，Optional Query: `manualPlayerId` |

## 6. 参赛统计 (Game Participant)
基础路径: `/api/game-participant`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list/{gameId}` | GET | 获取单场比赛所有参与者数据 | 进球数、红黄牌等 |
| `/batch-update` | POST | 批量更新参与者统计数据 | 需 ADMIN 角色，Body: `List<GameParticipant>` |

## 7. 实时通信 (Real-time)
基础路径: `/api/realtime`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/subscribe/{matchId}` | GET | 订阅赛事比分实时更新 | SSE 协议，推送 `MatchGame` 或 `MatchScoreLog` |

## 8. 关键模型定义 (Key Models)

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
    - `GROUPING_DRAFT`: 已出分组草案
    - `REGISTRATION_CLOSED`: 报名截止
    - `ONGOING`: 比赛进行中
    - `MATCH_FINISHED`: 所有场次结束
    - `SETTLED`: 已结算费用
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
