# 核心业务工作流 (Workflows)

## 1. 赛事生命周期状态机 (Match Event Lifecycle)

赛事流转遵循严格的状态机逻辑，管理员通过触发特定动作推动状态变更。

```mermaid
stateDiagram-v2
    [*] --> PREPARING : 发布赛事 (草稿)
    PREPARING --> PUBLISHED : 开始报名 (Open)
    PUBLISHED --> PREPARING : 撤回筹备 (Revert)
    PREPARING --> [*] : 删除赛事 (仅筹备期)
    
    PUBLISHED --> REGISTRATION_CLOSED : 到达截止时间
    REGISTRATION_CLOSED --> PUBLISHED : 延长截止时间 (Re-open)
    
    PUBLISHED --> CANCELLED : 取消赛事
    
    REGISTRATION_CLOSED --> GROUPING_DRAFT : 生成分组建议 (Draft)
    GROUPING_DRAFT --> GROUPING_DRAFT : 手动拖拽调整 (Manual)
    GROUPING_DRAFT --> ONGOING : 锁定分组并开赛 (Start Game)
    ONGOING --> MATCH_FINISHED : 比赛结束 (Finish Match)
    MATCH_FINISHED --> SETTLED : 确认结算 (Settle)
    SETTLED --> [*]
```

### 状态详细说明：
| 状态 | 说明 | 允许的操作 | 触发接口/代码 | UI 语义与页面 |
| :--- | :--- | :--- | :--- | :--- |
| **PREPARING** | 筹备中 | 编辑信息、**物理删除** | `publishMatch` (初始) | **筹备中** (管理后台编辑) |
| **PUBLISHED** | 报名阶段 | **球员报名**、撤回至筹备、修改截止时间 | `startRegistration` | **报名中** (球员报名页可见) |
| **REGISTRATION_CLOSED** | 报名锁定 | **延长截止时间回退至 PUBLISHED** | 时间触发或管理员修改 | **报名已截止** (等待分组) |
| **GROUPING_DRAFT** | 分组草稿 | **核心阶段**：执行算法生成草稿、管理员微调 | `confirmAndGroup` | **分组中** (排兵布阵/手动微调) |
| **ONGOING** | 比赛进行中 | 实时比分录入、进球审计 | `startWithGroups` | **比赛中** (实时比分/动态流) |
| **MATCH_FINISHED** | 待核算 | 手动修正数据、设置费用豁免 | `finishMatch` | **待核算** (赛后核对比分与数据) |
| **SETTLED** | 已结算 | 查看费用，**触发 ELO 评分演进** | `settleFees` | **已完结** (查看战报与费用单) |
| **CANCELLED** | 已取消 | 赛事终止 | `cancelMatch` | **已取消** (赛事失效) |

## 2. 核心控制逻辑规则
*   **撤回机制**：在 `PUBLISHED` 阶段若未进入分组，管理员可手动回退至 `PREPARING`。
*   **报名动态开关**：
    - 是否允许报名取决于 `(status == PUBLISHED && now < registrationDeadline)`。
    - **自动翻转**：若当前状态为 `REGISTRATION_CLOSED` 且管理员将截止时间修改为未来，状态应自动回退为 `PUBLISHED`。
*   **费用结算与评分演进**：
    - 状态转为 `SETTLED` 时自动发布 `MatchSettledEvent`。


## 3. 赛事自动分组与场次生成时序图

该流程展示了从发布赛事、球员报名、到最终触发自动分组并生成对阵列表的全过程。

```mermaid
sequenceDiagram
    actor Admin
    actor Player
    participant Controller as MatchController
    participant Service as MatchServiceImpl
    participant RegService as MatchRegistrationService
    participant StrategyFactory as GroupingStrategyFactory
    participant Strategy as SimpleSkillBalanceStrategy
    participant GameService as MatchGameService

    Admin->>Controller: POST /publish (numGroups=2, playersPerGroup=5)
    Controller->>Service: publishMatch()
    Service-->>Controller: Return Match(SCHEDULED)

    Player->>Controller: POST /{id}/register (playerId)
    Controller->>Service: registerForMatch()
    Service->>RegService: save(status=REGISTERED)

    Note over Admin, GameService: 比赛准备开始，执行分组

    Admin->>Controller: POST /{id}/group
    Controller->>Service: confirmAndGroup()
    
    Service->>RegService: getValidRegistrations()
    RegService-->>Service: List<Registration>
    
    Service->>StrategyFactory: getDefaultStrategy()
    StrategyFactory-->>Service: Strategy Instance
    
    Service->>Strategy: allocate(playerIds, numGroups)
    Note right of Strategy: 1. 按 Rating 降序<br/>2. Rating相同随机打乱<br/>3. 蛇形(Snake)分配
    Strategy-->>Service: Map<GroupIndex, List<PlayerId>>
    
    Service->>RegService: update groupIndex for all registered players
    
    Service->>Service: generateRoundRobinGames()
    Note right of Service: 自动生成循环赛对阵 (如 A-B)
    Service->>GameService: save(MatchGame(READY))
    
    Service->>Controller: Return Allocation Result
```

## 2. 比赛过程与比分演进时序图

该流程展示了比赛开始、进球记录（自动更新比分）、手动修改比分（占位符生成）的逻辑。

```mermaid
sequenceDiagram
    actor Referee
    participant GameCtrl as MatchGameController
    participant GameSvc as MatchGameServiceImpl
    participant GoalSvc as MatchGoalServiceImpl
    participant DB as MySQL (DB)

    Referee->>GameCtrl: POST /{id}/start (duration=45)
    GameCtrl->>GameSvc: startGame()
    GameSvc->>DB: update startTime, endTime, status=PLAYING
    
    Note over Referee, DB: 发生了一次真实进球

    Referee->>GameCtrl: POST /goal (scorerId, teamIndex)
    GameCtrl->>GameSvc: recordGoal()
    GameSvc->>GoalSvc: save(MatchGoal)
    GameSvc->>DB: scoreA = scoreA + 1 (自动累加)

    Note over Referee, DB: 裁判发现比分板错误，手动干预

    Referee->>GameCtrl: POST /{id}/score (scoreA=3)
    GameCtrl->>GameSvc: updateScoreManually()
    GameSvc->>GoalSvc: countByTeam() (假设当前只有1个Goal记录)
    Note right of GameSvc: 目标比分(3) > 已有记录(1)
    
    loop 生成占位符
        GameSvc->>GoalSvc: save(MatchGoal(scorerId=null))
    end
    
    GameSvc->>DB: force update scoreA = 3
```
