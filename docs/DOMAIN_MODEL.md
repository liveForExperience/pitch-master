# 领域模型 (Domain Model)

本文档定义了“老男孩俱乐部管理平台”的核心领域模型及其层级关系。所有代码实现、API 设计及数据库结构均应严格遵循此模型。

## 1. 领域层级 (Hierarchy)

| 层级 | 概念名称 | 业务定义 | 核心属性 |
| :--- | :--- | :--- | :--- |
| **L0: 平台层** | **Platform (平台)** | 隐式的最顶层概念，管理所有 Tournament。 | 平台管理员角色 |
| **L1: 租户层** | **Tournament (赛事)** | 系统的顶层容器，定义全局规则。 | 名称、加入模式(OPEN/APPROVAL)、最大人数 |
| **L2: 组织层** | **Club (俱乐部/球队)** | 球员的归属单位，属于具体赛事。 | 名称、Logo、所属赛事ID |
| **L3: 身份层** | **User / Player / TournamentPlayer** | **User** = 账户，**Player** = 全局球员档案，**TournamentPlayer** = 赛事级数据。 | 账号、角色、全局属性、赛事级评分 |
| **L4: 活动层** | **Match (比赛)** | 一次具体的活动实例。 | 时间、报名列表、计划场次、状态机 |
| **L5: 执行层** | **Game (场次)** | Match 中的具体对阵。 | 比分、实时统计 |

## 2. 核心关系与角色

### 2.1 角色与权限 (Roles & Identity)

系统采用三级角色体系：

| 角色 | 作用域 | 权限 |
| :--- | :--- | :--- |
| **platform_admin** | 全平台 | 创建/管理所有 Tournament，任命 Tournament 管理员 |
| **tournament_admin** | 指定 Tournament | 管理其下所有赛事、球员、分组、结算 |
| **player** | 全局 + 赛事级 | 加入 Tournament、报名参赛、进球数据、参与评分 |

*   **身份叠加**：一个用户可同时拥有 `platform_admin`、`tournament_admin`、`player` 身份。
*   **向后兼容**：原有 `admin` 角色自动映射为 `platform_admin`。
*   **关系约束**：`User` 与 `Player` 保持 1:1 关系（全局球员档案），一个 `Player` 可通过 `TournamentPlayer` 加入多个 Tournament。

### 2.2 球员数据分层

| 实体 | 作用域 | 存储内容 |
| :--- | :--- | :--- |
| **Player** | 全局 | 昵称、位置、年龄、性别、身高、惯用脚、俱乐部 |
| **TournamentPlayer** | 赛事级 | 加入状态(ACTIVE/PENDING/LEFT)、赛事内评分、昵称覆写、球衣号 |
| **PlayerRatingProfile** | 赛事级 | Skill/Performance/Engagement 三维评分 |
| **PlayerStat** | 赛事级 | 胜/平/负、进球、助攻、MVP 统计 |

### 2.3 组织关系
* 一个 **Tournament** 包含多个 **Club**。
* 一个 **Player** 可加入多个 **Tournament**（通过 `TournamentPlayer` 关联）。
* **tournament_admin** 通过 `tournament_admin` 表关联，拥有管理其下所有俱乐部、球员和比赛的权限。

### 2.4 活动与执行
* 一场 **Match** 包含多次 **Game**（基于分组算法动态生成）。
* **计划场次 (Planned Game Count)**：由管理员在发布活动时设定，直接影响系统自动排赛的数量。
* **Registration (报名)** 是球员（或未来俱乐部）参与 **Match** 的凭证。
* **Game Participant (场次参与者)** 是具体的表现记录：
    - 记录球员在特定 **Game** 中的进球、助攻、MVP 等数据。
    - 这是统计个人能力图表的最小数据单元。

## 3. 球员评分概览 (Player Rating Overview)

系统采用 **FM 风格 1-20 分制**的综合战力指数 (CPI) 对球员进行量化评估，服务于公平分组与成长记录。

### 评分维度
| 维度 | 含义 | 主要输入 |
| :--- | :--- | :--- |
| **Skill** | 长期技术能力 | 单场评分、历史进球/助攻积累 |
| **Performance** | 单场结果与数据表现 | 胜/平/负、进球、助攻、MVP |
| **Engagement** | 活跃度与参与贡献 | 出勤次数、连续活跃周、互评提交 |

**综合总分**: `Total = Skill × 0.40 + Performance × 0.40 + Engagement × 0.20`

### 评分的作用
- **公平分组**: 作为 `GroupingStrategy` 的首要加权因子
- **荣誉体系**: 球员战力曲线与历史荣誉墙
- **成长记录**: 完整的分维度审计日志

> 完整的计算公式、保护机制、衰减算法及管理员修正，详见 [RATING_SYSTEM.md](./RATING_SYSTEM.md)。
