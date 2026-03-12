# 数据模型 (Data Model)

本系统采用关系型数据库 (MySQL) 进行数据持久化，通过 Flyway 进行版本管理。

## 1. 实体关系图 (ER Diagram)

```mermaid
erDiagram
    USER ||--o| PLAYER : "has profile"
    USER {
        bigint id PK
        string username
        string password
        string salt
        string role "ADMIN, USER"
        int status
    }

    PLAYER ||--o{ MATCH_REGISTRATION : registers
    PLAYER {
        bigint id PK
        bigint user_id FK
        string nickname
        string position "GK, DF, MF, FW"
        decimal rating "1.0-10.0"
        string preferred_foot "LEFT, RIGHT, BOTH"
    }

    MATCH_EVENT ||--o{ MATCH_REGISTRATION : contains
    MATCH_EVENT ||--o{ MATCH_GAME : generates
    MATCH_EVENT {
        bigint id PK
        string title
        datetime start_time
        datetime cancel_deadline
        int num_groups
        int players_per_group
        decimal total_cost
        decimal per_person_cost
        string status "SCHEDULED, ONGOING, FINISHED"
    }

    MATCH_REGISTRATION {
        bigint id PK
        bigint match_id FK
        bigint player_id FK
        int group_index "0 to N"
        string status "REGISTERED, CANCELLED, NO_SHOW"
    }

    MATCH_GAME ||--o{ MATCH_GOAL : contains
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
    }

    MATCH_GOAL {
        bigint id PK
        bigint game_id FK
        int team_index
        bigint scorer_id "Nullable for placeholder"
        bigint assistant_id "Nullable"
        string type "NORMAL, OWN_GOAL"
        datetime occurred_at
    }
```

## 2. 关键设计说明
* **逻辑分离**：`MATCH_EVENT` 代表一次“活动”（如周六约战），`MATCH_GAME` 代表活动中的“具体场次”（如 A队 vs B队）。
* **费用分摊**：`MATCH_REGISTRATION.status` 为 `NO_SHOW` 时，表示该球员超过了 `cancel_deadline` 取消，不参与分组但**参与费用分摊**。
* **比分占位**：当管理员手动修改 `MATCH_GAME` 的比分且大于实际记录的 `MATCH_GOAL` 时，系统会自动生成 `scorer_id` 为空的 `MATCH_GOAL` 记录作为占位。
