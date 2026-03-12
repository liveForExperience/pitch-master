# 项目总体架构与指引 (Architecture & Guide)

## 1. 项目概述
**Oldboy Club Manager** 是一个专为业余足球爱好者设计的俱乐部与赛事管理平台。其核心价值在于提供自动化的比赛分组（基于多维度能力的平衡算法）、比赛过程管理（进球、加时、比分演进）以及赛后数据统计。

## 2. 技术栈 (Tech Stack)
*   **语言**: Java 23
*   **核心框架**: Spring Boot 3.4.0
*   **持久层**: MyBatis-Plus 3.5.9, MySQL
*   **版本控制**: Flyway (数据库迁移脚本位于 `src/main/resources/db/migration/`)
*   **安全框架**: Apache Shiro 2.0.2 (基于 SHA-256 + 随机盐的密码验证)
*   **工具库**: Hutool 5.8.34, Lombok

## 3. 核心模块与职责边界

系统遵循严格的**面向接口编程 (Interface-based Programming)** 原则。所有业务模块之间不直接依赖实现类。

*   **Auth Module (`com.bottomlord.shiro`, `UserController`)**: 负责基于 Shiro 的用户登录、注册、角色控制（ADMIN/USER）。
*   **Player Module (`PlayerService`)**: 维护球员的身体机能与技术评分数据（Rating, Position, Preferred Foot）。
*   **Match Event Module (`MatchEventService`)**: 大赛事生命周期管理（发布 -> 报名 -> 分组 -> 结算）。
*   **Grouping Strategy Module (`GroupingStrategyFactory`)**: **核心算法模块**。采用策略模式和工厂模式，支持动态切换不同的分组算法。
*   **Match Game Module (`MatchGameService`, `MatchGoalService`)**: 具体场次管理。支持动态时长、进球事件驱动的比分计算以及比分占位符（Placeholder）机制。
*   **Report Exporter Module (`MatchReportExporter`)**: 采用策略模式生成战报（当前支持 Text 格式）。

## 4. 给其他 Agent/开发者的重构与重建指南
如果您需要基于本文档重建或重构该系统，请严格遵循以下顺序：
1.  **阅读数据模型**：查看 `DATA_MODEL.md`，使用 Flyway 脚本重建数据库。
2.  **构建核心实体**：根据 `CLASS_DIAGRAM.md` 定义实体（Entity）和 Mapper。
3.  **实现策略模式**：先实现 `GroupingStrategy` 和 `MatchReportExporter` 接口，这保证了核心算法与业务流解耦。
4.  **实现服务流转**：参考 `WORKFLOW.md` 中的时序图，实现 Service 层的状态流转。
