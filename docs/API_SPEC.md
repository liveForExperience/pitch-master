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
| `/register` | POST | 用户注册 | `User` 对象 (JSON) |
| `/unauthenticated` | GET | 未认证重定向地址 | 无 |

## 3. 赛事管理模块 (Match Event)
基础路径: `/api/match`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取待开赛赛事列表 | 无 |
| `/{id}` | GET | 获取赛事详情 | 无 |
| `/publish` | POST | 发布新赛事 | 需 ADMIN 角色，Body: `Match` |
| `/{id}/register` | POST | 球员报名 | Query: `playerId` |
| `/{id}/cancel` | POST | 取消报名/反悔 | 处理 Late Cancellation 逻辑 |
| `/{id}/group` | POST | 确认并触发自动分组 | 返回 Map<GroupIndex, List<PlayerId>> |
| `/{id}/finish` | POST | 完成赛事并结算费用 | 触发 perPersonCost 计算 |
| `/{id}/registrations` | GET | 获取计费报名列表 | 返回所有需分摊费用的报名信息 |
| `/{id}/payment` | POST | 更新缴费状态 | Query: `playerId`, `status` |
| `/{matchId}/report` | GET | 获取动态生成的战报 | 返回战报内容 |

## 4. 比赛场次与进球模块 (Match Game)
基础路径: `/api/game`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/list` | GET | 获取赛事下的所有场次 | Query: `matchId` |
| `/{id}/start` | POST | 标记比赛开始 | Query: `durationMinutes` |
| `/{id}/overtime` | POST | 增加加时时间 | Query: `extraMinutes` |
| `/goal` | POST | 录入进球/助攻/乌龙 | Body: `MatchGoal` |
| `/{id}/score` | POST | 手动修正比分 | Query: `scoreA`, `scoreB` (触发占位逻辑) |
| `/{id}/finish` | POST | 标记单场比赛结束 | 状态变更为 FINISHED |
| `/{id}/lock` | POST | 尝试获取比分修改锁 | 冲突返回 409 |
| `/{id}/unlock` | POST | 手动释放修改锁 | 用户主动取消编辑时调用 |
| `/{gameId}/logs` | GET | 获取比分变更审计日志 | 按时间倒序返回 MatchScoreLog |

## 5. 实时通信 (Real-time)
基础路径: `/api/realtime`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/subscribe/{matchId}` | GET | 订阅赛事比分实时更新 | SSE 协议，推送更新后的 MatchGame 对象 |

## 5. 关键实体模型 (DTO/VO)
前端应严格对齐以下字段名：
*   **Match**: `numGroups`, `playersPerGroup`, `cancelDeadline`, `totalCost`, `perPersonCost`
*   **MatchGame**: `lockUserId`, `lockTime` (用于判断锁定状态)
*   **MatchGoal**: `teamIndex`, `scorerId` (可为 null), `assistantId`, `type` ("NORMAL" | "OWN_GOAL")
