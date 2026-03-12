# Oldboy Club Manager (老男孩俱乐部管理平台)

**Oldboy Club Manager** 是一个专为业余足球爱好者设计的开源赛事与俱乐部管理平台。它不仅是一个报名工具，更是一个集成了自动化平衡分组算法、比赛过程管理及赛后战报生成的闭环管理系统。

## 🌟 核心特性 (Features)

*   **智能分组算法 (Grouping Algorithm)**: 
    *   **蛇形分组 (Snake Draft)**: 基于球员 Rating (技术分) 自动实现实力均衡。
    *   **多维度加权**: 预留了位置 (GK/DF/MF/FW)、默契度、配合意愿等权重的扩展接口。
    *   **占位符机制**: 支持手动修正比分后的未知进球事件自动填充。
*   **赛事全生命周期管理**: 
    *   **发布与报名**: 支持设定取消报名截止时间 (Late Cancellation)，处理反悔扣费逻辑。
    *   **自动循环赛**: 启动赛事后自动生成所有对阵场次 (Round Robin)。
    *   **动态计时**: 支持加时 (Injury Time) 逻辑，自动更新预定结束时间。
*   **安全与权限**: 
    *   基于 **Apache Shiro** 的角色控制 (ADMIN/USER)。
    *   密码采用 **SHA-256 + 随机盐** 安全加密。
*   **自动化报表**: 
    *   一键生成纯文本战报，含比分、进球人、助攻榜、射手榜。

## 🛠️ 技术栈 (Tech Stack)

*   **后端**: Spring Boot 3.4, MyBatis-Plus, MySQL
*   **安全**: Apache Shiro 1.13.0
*   **迁移**: Flyway
*   **工具**: Hutool, Lombok, JUnit 5, Mockito

## 📂 项目结构

```text
.
├── docs/                # 详尽的架构设计文档 (ER图、时序图、类图、API规范)
├── src/main/java/       # 业务代码实现
├── src/main/resources/  # 配置文件与数据库脚本
└── src/test/java/       # 完整的集成测试用例
```

## 🚀 快速开始

1.  **数据库准备**: 创建 MySQL 数据库 `oldboy_club_manager`。
2.  **配置修改**: 修改 `src/main/resources/application.yml` 中的数据库账号密码。
3.  **运行项目**: 运行 `com.bottomlord.Main` 类，Flyway 将自动初始化表结构。
4.  **接口测试**: 参考 `docs/API_SPEC.md` 使用 Postman 或 cURL 进行测试。

## 📖 开发者文档

更多关于设计模式（策略模式、工厂模式）及核心工作流的详细说明，请查阅 [docs/README.md](./docs/README.md)。

---

*本项目遵循《阿里巴巴 Java 开发手册》规约编写。*
