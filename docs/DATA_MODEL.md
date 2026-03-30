# PitchMaster 数据模型与领域结构

本系统采用关系型数据库 (MySQL) 进行数据持久化，通过 Flyway 进行版本管理（当前最新：V19）。

---

## 1. 领域层次结构

```
Platform（平台）
└── Tournament（赛事，顶层租户隔离单元）
    ├── Club（俱乐部，Tournament 内的组织单元）
    ├── TournamentPlayer（球员在本 Tournament 的身份与时间信息）
    ├── Match（赛事活动）
    │   ├── MatchRegistration（球员报名）
    │   ├── MatchGame（单场比赛）
    │   │   ├── GameParticipant（单场数据：进球/助攻/MVP）
    │   │   └── MatchGoal（进球记录）
    │   └── MatchScoreLog（比分变动审计）
    ├── PlayerRatingProfile（三维评分档案，按 Tournament 隔离）
    ├── PlayerStat（战绩统计，按 Tournament 隔离）
    └── PlayerRatingHistory（评分变动审计，按 Tournament 隔离）

Player（全局球员档案，不绑定 Tournament）
└── PlayerMutualRating（赛后互评，记录荣誉与 MVP 投票）
```

**球员数据分层设计：**

| 层级 | 表 | 说明 |
|------|-----|------|
| 全局档案 | `player` | 昵称、位置、身高等不变属性 |
| Tournament 身份 | `tournament_player` | 加入状态、时间记录 |
| Tournament 评分 | `player_rating_profile` | 三维评分 + 总分（计算值，不存储） |
| Tournament 战绩 | `player_stat` | 胜平负、进球、助攻、MVP 数 |
| 审计 | `player_rating_history` | 每次评分维度变动的完整记录 |

**角色体系：**

| 角色 | 职责 |
|------|------|
| `platform_admin` | 管理全局平台，创建/管理 Tournament |
| `admin`（Tournament Admin） | 管理指定 Tournament 内的比赛、球员、评分 |
| `player` | 报名参赛、提交互评 |

---

## 2. 实体关系图

```mermaid
erDiagram
    TOURNAMENT ||--o{ CLUB : "contains"
    TOURNAMENT ||--o{ TOURNAMENT_PLAYER : "has"
    TOURNAMENT ||--o{ MATCH_EVENT : "hosts"

    USER ||--o| PLAYER : "has profile"
    PLAYER ||--o{ TOURNAMENT_PLAYER : "joins"
    PLAYER ||--o{ MATCH_REGISTRATION : "registers"
    PLAYER ||--o{ GAME_PARTICIPANT : "plays"
    PLAYER ||--o{ PLAYER_MUTUAL_RATING : "rates/is rated"

    TOURNAMENT_PLAYER ||--o{ PLAYER_RATING_PROFILE : "has"
    TOURNAMENT_PLAYER ||--o{ PLAYER_STAT : "accumulates"

    TOURNAMENT {
        bigint id PK
        string name
        string description
        string join_mode "OPEN, APPROVAL"
        string logo
        int max_players
        int status
        datetime deleted_at "软删除时间，NULL 表示活跃"
        bigint deleted_by FK "删除操作人 user_id"
    }

    TOURNAMENT_ADMIN {
        bigint id PK
        bigint tournament_id FK
        bigint user_id FK
    }

    USER {
        bigint id PK
        string username
        string real_name
        string role "admin, player"
        tinyint status
    }

    PLAYER {
        bigint id PK
        bigint user_id FK
        string nickname
        string position "GK, DF, MF, FW"
        int age
        string preferred_foot "LEFT, RIGHT, BOTH"
        string gender "MALE, FEMALE"
        int height "cm"
        tinyint status "1:Active, 0:Inactive"
    }

    TOURNAMENT_PLAYER {
        bigint id PK
        bigint tournament_id FK
        bigint player_id FK
        bigint club_id FK
        string join_status "PENDING, ACTIVE, LEFT"
        tinyint status
        datetime last_match_time
        datetime last_attendance_time
    }

    MATCH_EVENT ||--o{ MATCH_REGISTRATION : "has"
    MATCH_EVENT ||--o{ MATCH_GAME : "contains"
    MATCH_EVENT {
        bigint id PK
        bigint tournament_id FK
        string title
        datetime start_time
        datetime actual_start_time
        datetime registration_deadline
        datetime cancel_deadline
        string status "PREPARING,PUBLISHED,REGISTRATION_CLOSED,ONGOING,MATCH_FINISHED,CANCELLED"
        int num_groups
        int planned_game_count
        decimal total_cost
        decimal per_person_cost
        tinyint groups_published
        tinyint settlement_published
        json team_names
        datetime deleted_at
    }

    MATCH_REGISTRATION {
        bigint id PK
        bigint match_id FK
        bigint player_id FK
        int group_index
        string status "REGISTERED, PENDING, CANCELLED, NO_SHOW"
        string payment_status "UNPAID, PAID"
        boolean is_exempt
        decimal payment_amount
        tinyint is_mvp
    }

    MATCH_GAME ||--o{ MATCH_GOAL : "has"
    MATCH_GAME ||--o{ GAME_PARTICIPANT : "tracks"
    MATCH_GAME ||--o{ MATCH_SCORE_LOG : "logs"
    MATCH_GAME {
        bigint id PK
        bigint match_id FK
        int team_a_index
        int team_b_index
        int score_a
        int score_b
        int game_index
        string status "READY, PLAYING, FINISHED"
        bigint lock_user_id FK
    }

    GAME_PARTICIPANT {
        bigint id PK
        bigint game_id FK
        bigint player_id FK
        int goals
        int assists
        tinyint is_mvp
        decimal rating "单场人工评分"
    }

    MATCH_GOAL {
        bigint id PK
        bigint game_id FK
        int team_index
        bigint scorer_id FK
        bigint assistant_id FK
        string type "NORMAL, OWN_GOAL"
        datetime occurred_at
    }

    PLAYER_MUTUAL_RATING {
        bigint id PK
        bigint match_id FK
        bigint from_player_id FK
        bigint to_player_id FK
        decimal rating_skill
        decimal rating_fitness
        decimal rating_attitude
        decimal rating_vision
        tinyint is_mvp_vote
        string comment
    }

    PLAYER_RATING_PROFILE {
        bigint id PK
        bigint player_id FK
        bigint tournament_id FK
        decimal skill_rating "1.0-20.0"
        decimal performance_rating "1.0-20.0"
        decimal engagement_rating "1.0-20.0"
        int provisional_matches "已出场场次(保护期)"
        int appearance_count "总出场次数"
        int active_streak_weeks "连续活跃周数"
        datetime last_attendance_time
        datetime last_decay_time
        int rating_version
    }

    PLAYER_STAT {
        bigint id PK
        bigint player_id FK
        bigint tournament_id FK
        int total_matches
        int wins
        int draws
        int losses
        int total_goals
        int total_assists
        int total_mvps
        int clean_sheets
    }

    PLAYER_RATING_HISTORY {
        bigint id PK
        bigint player_id FK
        bigint tournament_id FK
        bigint match_id FK
        string dimension "SKILL/PERFORMANCE/ENGAGEMENT/TOTAL/DECAY"
        string source_type "MATCH_SETTLEMENT/INACTIVITY_DECAY/ADMIN_CORRECTION/INITIALIZATION"
        decimal old_value
        decimal new_value
        decimal delta
        string reason_code
        string reason_detail
        bigint operator_user_id FK
        datetime create_time
    }

    MATCH_SCORE_LOG {
        bigint id PK
        bigint game_id FK
        int score_a
        int score_b
        string type "GOAL, MANUAL"
        datetime created_at
    }
```

---

## 3. 关键设计说明

- **多租户隔离**：`tournament_id` 是核心隔离键。`player_rating_profile`、`player_stat`、`player_rating_history` 均按 `(player_id, tournament_id)` 唯一隔离。
- **总评分不存储**：总评 = Skill × 0.4 + Performance × 0.4 + Engagement × 0.2，在查询时实时计算。
- **`player` 表职责**：仅存储全局不变属性（昵称、身高等），与 Tournament 无关。Tournament 内身份由 `tournament_player` 管理。
- **互评定位**：`player_mutual_rating` 记录赛后荣誉投票，不直接驱动 CPI 三维评分。
- **费用分摊**：`cancel_deadline` 后取消报名视为 `NO_SHOW`，`is_exempt=true` 豁免分摊，剩余费用向上取整平摊。
- **比分审计**：`match_score_log` 记录每次比分变动，触发 SSE 推送。
- **软删除**：`match` 表和 `tournament` 表均通过 `deleted_at` + `deleted_by` 实现软删除；列表查询自动过滤 `deleted_at IS NOT NULL` 的记录。
- **Tournament 物理删除**：物理删除 Tournament 时，级联删除所有关联数据（`tournament_admin`、`club`、`tournament_player`、`match`（及其 games/goals/participants/score_logs）、`player_mutual_rating`、`player_stat`、`player_rating_profile`、`player_rating_history`）；仅允许对已软删除的 Tournament 执行物理删除。
