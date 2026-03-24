# PitchMaster

**PitchMaster** 是一个专为业余足球爱好者设计的赛事与俱乐部管理平台。提供从赛事发布、智能分组、实时比分到赛后评分的完整闭环管理解决方案。

## Features

- **智能分组算法**: 基于球员评分的蛇形分组 (Snake Draft)，自动实现实力均衡
- **赛事全流程管理**: 发布、报名、分组、比赛、结算的完整生命周期
- **FM 风格评分系统**: 1-20 分制三维评分 (Skill/Performance/Engagement)，支持衰减与保护机制
- **实时比分同步**: 基于 SSE 的实时推送，毫秒级更新所有终端
- **费用自动结算**: 支持人均分摊、豁免标记、取消扣费等复杂场景
- **完整审计日志**: 比分变动、评分演进全程可追溯

## Tech Stack

**Backend**
- Spring Boot 3.4 + MyBatis-Plus + MySQL
- Apache Shiro (认证授权)
- Flyway (数据库版本管理)
- SSE (Server-Sent Events)

**Frontend**
- React 18 + TypeScript + Vite
- Ant Design Mobile + Tailwind CSS
- Zustand (状态管理)
- ECharts (数据可视化)

## Quick Start

### Prerequisites
- JDK 17+
- MySQL 8.0+
- Node.js 18+

### Backend Setup

```bash
# 1. Create database
mysql -u root -p
CREATE DATABASE pitch_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Configure database connection
# Edit src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pitch_master
    username: YOUR_USERNAME
    password: YOUR_PASSWORD

# 3. Run application
./mvnw spring-boot:run
```

Backend runs at `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Default Credentials

**Admin Account**
- Username: `admin`
- Password: `admin123`

**Player Account**
- Username: `player1`
- Password: `player123`

## Project Structure

```
.
├── docs/                    # Architecture & API documentation
│   ├── README.md           # Documentation index
│   ├── ARCHITECTURE.md     # System design & multi-tenancy
│   ├── API_SPEC.md         # RESTful API reference
│   ├── DATA_MODEL.md       # Database schema & ER diagram
│   ├── RATING_SYSTEM.md    # FM-style rating mechanics
│   └── WORKFLOW.md         # Business workflows & SOP
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── api/           # API client & type definitions
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   └── store/         # Zustand stores
│   └── package.json
├── src/main/
│   ├── java/com/bottomlord/
│   │   ├── controller/    # REST controllers
│   │   ├── service/       # Business logic
│   │   ├── mapper/        # MyBatis mappers
│   │   └── entity/        # Domain entities
│   └── resources/
│       ├── db/migration/  # Flyway migration scripts
│       └── application.yml
└── pom.xml
```

## Core Concepts

### Multi-Tenancy Model

- **Tournament** (赛事): Top-level tenant isolation
- **Club** (俱乐部): Organization-level grouping
- **Player** (球员): Individual profiles with ratings

### Match Lifecycle

```
PREPARING → PUBLISHED → REGISTRATION_CLOSED → GROUPING_DRAFT
    → ONGOING → MATCH_FINISHED
```

### Rating System (FM Style 1-20)

- **Total Rating** = Skill × 0.4 + Performance × 0.4 + Engagement × 0.2
- **New Player Protection**: First 3 matches with reduced variance
- **Decay Mechanism**: -0.1 Engagement per week after 30 days inactivity
- **Admin Override**: Manual corrections with full audit trail

## Documentation

Comprehensive documentation available in [`docs/`](./docs):

- **[Architecture Guide](./docs/ARCHITECTURE.md)**: System design, SSE, multi-tenancy
- **[API Reference](./docs/API_SPEC.md)**: Complete REST API specification
- **[Data Model](./docs/DATA_MODEL.md)**: Database schema & relationships
- **[Rating System](./docs/RATING_SYSTEM.md)**: FM-style rating mechanics
- **[Workflows](./docs/WORKFLOW.md)**: Business processes & development SOP

## Development

### Database Migration

```bash
# Migrations run automatically on startup via Flyway
# Migration files: src/main/resources/db/migration/V*.sql
```

### Testing

```bash
# Run backend tests
./mvnw test

# Run frontend tests
cd frontend
npm test
```

### Code Standards

- Follows Alibaba Java Coding Guidelines
- Strategy pattern for algorithms (grouping, rating)
- Factory pattern for strategy management
- Comprehensive audit logging for critical operations

## API Overview

**Authentication**
```bash
POST /auth/login          # User login
GET  /auth/me             # Current user info
```

**Match Management**
```bash
GET    /api/match/list           # List matches
POST   /api/match/publish        # Create match (admin)
POST   /api/match/{id}/register  # Register for match
POST   /api/match/{id}/group     # Generate groups (admin)
```

**Real-time Updates**
```bash
GET /api/realtime/subscribe/{matchId}  # SSE subscription
```

See [API_SPEC.md](./docs/API_SPEC.md) for complete reference.

## Troubleshooting

### Database connection failed
**Cause**: MySQL not running or incorrect credentials

**Solution**:
```bash
# Check MySQL status
mysql.server status

# Verify credentials in application.yml
```

### Frontend proxy errors
**Cause**: Backend not running on port 8080

**Solution**:
```bash
# Check backend is running
curl http://localhost:8080/auth/unauthenticated

# Restart backend if needed
./mvnw spring-boot:run
```

### Flyway migration conflicts
**Cause**: Manual database changes conflicting with migrations

**Solution**:
```bash
# Check migration status
./mvnw flyway:info

# Repair if needed (use with caution)
./mvnw flyway:repair
```

## Contributing

Development follows strict workflow discipline:

1. **Define before coding**: Clear requirements, boundaries, acceptance criteria
2. **Database changes first**: Flyway migrations before entity updates
3. **API contract before UI**: Backend interface before frontend integration
4. **Small commits**: Single topic per commit
5. **Documentation is deliverable**: Update docs with code changes

See [WORKFLOW.md](./docs/WORKFLOW.md) for complete development SOP.

## License

MIT License

## Support

For issues and questions:
- Review [documentation](./docs/README.md)
- Check [API specification](./docs/API_SPEC.md)
- See [workflow guide](./docs/WORKFLOW.md) for development process
