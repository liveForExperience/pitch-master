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
| `/publish` | POST | 发布新赛事 | 需 ADMIN 角色，Body: `MatchEvent` |
| `/{id}/register` | POST | 球员报名 | Query: `playerId` |
| `/{id}/cancel` | POST | 取消报名/反悔 | 处理 Late Cancellation 逻辑 |
| `/{id}/group` | POST | 确认并触发自动分组 | 返回 Map<GroupIndex, List<PlayerId>> |
| `/{id}/finish` | POST | 完成赛事并结算费用 | 触发 perPersonCost 计算 |
| `/{id}/report` | GET | 获取动态生成的战报 | 返回战报字符串或 JSON 对象 |

## 4. 比赛场次与进球模块 (Match Game)
基础路径: `/api/game`

| 接口 | 方法 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| `/{id}/start` | POST | 标记比赛开始 | Query: `durationMinutes` |
| `/{id}/overtime` | POST | 增加加时时间 | Query: `extraMinutes` |
| `/goal` | POST | 录入进球/助攻/乌龙 | Body: `MatchGoal` |
| `/{id}/score` | POST | 手动修正比分 | Query: `scoreA`, `scoreB` (触发占位逻辑) |
| `/{id}/finish` | POST | 标记单场比赛结束 | 状态变更为 FINISHED |

## 5. 关键实体模型 (DTO/VO)
前端应严格对齐以下字段名：
*   **MatchEvent**: `numGroups`, `playersPerGroup`, `cancelDeadline`, `totalCost`, `perPersonCost`
*   **MatchGoal**: `teamIndex`, `scorerId` (可为 null), `assistantId`, `type` ("NORMAL" | "OWN_GOAL")
