# 数据模型 (Data Model)

本系统采用关系型数据库 (MySQL) 进行数据持久化，通过 Flyway 进行版本管理。

## 1. 实体关系图 (ER Diagram)

```mermaid
erDiagram
    TOURNAMENT ||--o{ CLUB : "contains"
    TOURNAMENT ||--o{ PLAYER : "contains"
    TOURNAMENT ||--o{ MATCH_EVENT : "contains"
    
    CLUB ||--o{ PLAYER : "manages"

    USER ||--o| PLAYER : "has profile"
    USER {
        bigint id PK
        string username
        string password
        string salt
        string real_name
        string role "admin, player"
        tinyint status "1:Active, 0:Disabled"
        datetime created_at
        datetime updated_at
    }

    PLAYER ||--o{ MATCH_REGISTRATION : registers
    PLAYER ||--o{ GAME_PARTICIPANT : "plays in"
    PLAYER ||--o{ PLAYER_MUTUAL_RATING : "rates/is rated"
    PLAYER ||--o| PLAYER_RATING_PROFILE : "has profile"
    PLAYER {
        bigint id PK
        bigint user_id FK
        bigint tournament_id FK
        bigint real_club_id FK
        string nickname
        string position "GK, DF, MF, FW"
        decimal rating "1.0-20.0 FM-style total rating"
        int rating_version "Rating system version"
        int age
        string preferred_foot "LEFT, RIGHT, BOTH"
        tinyint status "1:Active, 0:Inactive"
        datetime last_match_time "Used for rating decay"
        datetime last_attendance_time "Last attendance time"
    }

    MATCH_EVENT ||--o{ MATCH_REGISTRATION : contains
    MATCH_EVENT ||--o{ MATCH_GAME : generates
    MATCH_EVENT {
        bigint id PK
        bigint tournament_id FK
        string title
        datetime start_time
        datetime registration_deadline
        datetime cancel_deadline
        string location
        string registration_type "PLAYER, CLUB"
        int num_groups
        int players_per_group
        int planned_game_count
        decimal total_cost
        decimal per_person_cost
        string status "PREPARING, PUBLISHED, GROUPING_DRAFT, REGISTRATION_CLOSED, ONGOING, MATCH_FINISHED, SETTLED, CANCELLED"
    }

    MATCH_REGISTRATION {
        bigint id PK
        bigint match_id FK
        bigint player_id FK
        int group_index "0 to N"
        string status "REGISTERED, CANCELLED, NO_SHOW"
        string payment_status "UNPAID, PAID"
        boolean is_exempt "Exempt from fees"
        tinyint is_mvp "Final Match MVP flag (Global per activity)"
    }

    MATCH_GAME ||--o{ MATCH_GOAL : contains
    MATCH_GAME ||--o{ GAME_PARTICIPANT : "recorded stats"
    MATCH_GAME {
        bigint id PK
        bigint match_id FK
        int team_a_index
        int team_b_index
        datetime start_time
        datetime end_time
        int overtime_minutes
        int score_a
        int score_b
        string status "READY, PLAYING, FINISHED"
        bigint updated_by FK
        bigint lock_user_id FK
        datetime lock_time
    }

    GAME_PARTICIPANT {
        bigint id PK
        bigint game_id FK
        bigint player_id FK
        int goals
        int assists
        tinyint is_mvp "Game performance MVP (Local per single game)"
        decimal rating "Performance rating"
    }

    MATCH_GOAL {
        bigint id PK
        bigint game_id FK
        int team_index
        bigint scorer_id FK "Nullable"
        bigint assistant_id FK "Nullable"
        string type "NORMAL, OWN_GOAL"
        datetime occurred_at
        bigint created_by FK
        bigint updated_by FK
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
        decimal skill_rating "Skill dimension 1.0-20.0"
        decimal performance_rating "Performance dimension 1.0-20.0"
        decimal engagement_rating "Engagement dimension 1.0-20.0"
        int provisional_matches "Games played (for protection)"
        int appearance_count "Total appearances"
        int active_streak_weeks "Continuous active weeks"
        datetime last_attendance_time
        datetime last_decay_time
        int rating_version
    }

    PLAYER_RATING_HISTORY {
        bigint id PK
        bigint player_id FK
        bigint match_id FK
        string dimension "SKILL/PERFORMANCE/ENGAGEMENT/TOTAL/DECAY"
        string source_type "MATCH_SETTLEMENT/INACTIVITY_DECAY/ADMIN_CORRECTION"
        decimal old_rating
        decimal new_rating
        decimal old_value
        decimal new_value
        decimal delta
        string change_reason
        string reason_code
        string reason_detail
        bigint operator_user_id FK
        datetime create_time
    }

    PLAYER_RELATIONSHIP {
        bigint id PK
        bigint from_player_id FK
        bigint to_player_id FK
        int willingness "Willingness to play together"
        int chemistry "Historical common games count"
    }

    MATCH_SCORE_LOG {
        bigint id PK
        bigint game_id FK
        int score_a
        int score_b
        bigint operator_id FK
        string type "GOAL, MANUAL, CORRECTION"
        datetime created_at
    }

    SYSTEM_STATUS {
        string config_key PK
        string config_value
        string description
        datetime updated_at
    }
```

## 2. 关键设计说明
* **多租户体系**：
    - `TOURNAMENT` (赛事)：最高级隔离，如“老男孩俱乐部公开赛”。
    - `CLUB` (俱乐部)：逻辑组织层，属于某个 `TOURNAMENT`。
* **状态机流转**：
    - `MATCH_EVENT`：`PREPARING` -> `PUBLISHED` (开放报名) -> `REGISTRATION_CLOSED` -> `ONGOING` -> `MATCH_FINISHED` -> `SETTLED` (费用结算)。
* **费用分摊与豁免**：
    - `is_exempt`：标记特定人员（如特殊嘉宾或伤退者）不参与分摊。
    - `NO_SHOW`：报名后未准时参加且未提前取消，需参与费用平摊。
* **数据审计与锁定**：
    - `MATCH_SCORE_LOG`：专门用于追踪单场比赛比分的每一次跳动，记录操作轨迹。
    - `lock_user_id`：管理员在编辑场次数据时会进行乐观锁定，防止并发修改。
* **球员成长与衰减**：
    - `last_attendance_time`：用于追踪球员活跃度，超过30天不活跃触发衰减。
    - `PLAYER_RATING_PROFILE`：存储三维评分档案（Skill/Performance/Engagement），支持 FM 风格 1-20 分制。
    - `PLAYER_RATING_HISTORY`：记录所有评分变动的审计日志，包括维度、来源、操作人等详细信息。
    - `PLAYER_MUTUAL_RATING`：提供多维度的球员反馈，作为动态评分策略的输入。
* **评分系统 (FM Style 1-20)**：
    - 总评分 = Skill × 0.4 + Performance × 0.4 + Engagement × 0.2
    - 新球员前3场享受保护期，变动幅度减小
    - 超过30天不活跃触发衰减，每周 Engagement -0.1
    - 所有评分下限为 1.00，上限为 20.00
