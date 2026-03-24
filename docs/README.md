# Documentation Index

Welcome to PitchMaster technical documentation. This guide provides comprehensive coverage of system architecture, API specifications, business logic, and development workflows.

## Getting Started

**New to the project?** Start here:
1. Read the [main README](../README.md) for project overview and quick start
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design principles
3. Check [API_SPEC.md](./API_SPEC.md) for available endpoints
4. Follow [WORKFLOW.md](./WORKFLOW.md) for development standards

## Documentation Structure

### 📐 System Design

#### [ARCHITECTURE.md](./ARCHITECTURE.md)
Core system architecture and design patterns
- Multi-tenancy model (Tournament → Club → Player)
- Real-time architecture with SSE (Server-Sent Events)
- Audit trail and data versioning
- Concurrency control strategies
- Technology stack rationale

**When to read**: Before major refactoring, when understanding system-wide patterns

---

### 🗄️ Data Layer

#### [DATA_MODEL.md](./DATA_MODEL.md)
Complete database schema and entity relationships
- ER diagrams (Mermaid format)
- Table definitions with field descriptions
- State machine flows (Match, Game, Registration)
- Fee settlement and exemption logic
- Rating profile and audit tables

**When to read**: Before database migrations, when designing new features that require data persistence

#### [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
Business domain concepts and hierarchies
- Domain entity definitions
- Role and identity relationships
- Multi-level data isolation model

**When to read**: When understanding business logic boundaries, before domain-driven design discussions

---

### 🔌 API Layer

#### [API_SPEC.md](./API_SPEC.md)
RESTful API complete reference
- Unified response format
- Authentication endpoints
- Match management APIs
- Real-time subscription (SSE)
- Player rating APIs
- Request/response examples

**When to read**: Before frontend integration, when implementing new endpoints

---

### 📊 Business Logic

#### [RATING_SYSTEM.md](./RATING_SYSTEM.md)
FM-style player rating mechanics (1-20 scale)
- Three-dimensional rating (Skill/Performance/Engagement)
- Calculation formulas and weights
- New player protection mechanism
- Inactivity decay algorithm
- Admin correction capabilities
- Audit trail requirements

**When to read**: Before modifying rating calculations, when troubleshooting rating changes

#### [WORKFLOW.md](./WORKFLOW.md)
Business workflows and development SOP
- Match event lifecycle state machine
- Auto-grouping sequence diagrams
- Real-time score update flows
- **Development discipline and standards**
- Definition of Done checklist

**When to read**: Daily development reference, before starting any feature work

---

### 🏗️ Code Structure

#### [CLASS_DIAGRAM.md](./CLASS_DIAGRAM.md)
Key design patterns and class relationships
- Strategy pattern (Grouping algorithms)
- Factory pattern (Strategy management)
- Service layer architecture
- Interface definitions

**When to read**: When extending algorithms, before adding new strategies

#### [UI_DESIGN.md](./UI_DESIGN.md)
Frontend architecture and design system
- Technology stack (React + TypeScript)
- UI component library (Ant Design Mobile)
- Page structure and routing
- Visual identity and theme
- State management approach

**When to read**: Before frontend development, when designing new pages

---

## Quick Reference

### Common Development Tasks

| Task | Primary Reference | Supporting Docs |
|------|------------------|----------------|
| Add new API endpoint | [API_SPEC.md](./API_SPEC.md) | [WORKFLOW.md](./WORKFLOW.md) |
| Modify database schema | [DATA_MODEL.md](./DATA_MODEL.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Change rating logic | [RATING_SYSTEM.md](./RATING_SYSTEM.md) | [DATA_MODEL.md](./DATA_MODEL.md) |
| Implement new feature | [WORKFLOW.md](./WORKFLOW.md) | All docs |
| Debug state machine | [WORKFLOW.md](./WORKFLOW.md) | [DATA_MODEL.md](./DATA_MODEL.md) |
| Frontend integration | [API_SPEC.md](./API_SPEC.md) + [UI_DESIGN.md](./UI_DESIGN.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) |

### Key Principles

1. **Database changes first**: Write Flyway migrations before modifying entities
2. **API contract before UI**: Define backend interfaces before frontend integration
3. **Documentation is deliverable**: Update docs alongside code changes
4. **Audit everything critical**: Log rating changes, score updates, state transitions
5. **Multi-tenancy awareness**: Always filter by `tournament_id`

### State Machines

**Match Lifecycle**
```
PREPARING → PUBLISHED → REGISTRATION_CLOSED → GROUPING_DRAFT 
    → ONGOING → MATCH_FINISHED
```

**Game Status**
```
READY → PLAYING → FINISHED
```

**Registration Status**
```
REGISTERED | CANCELLED | NO_SHOW | PENDING
```

## Diagram Conventions

All diagrams use standard Mermaid syntax:
- **ER Diagrams**: Entity relationships with cardinality
- **Sequence Diagrams**: API call flows and interactions
- **State Diagrams**: Business state machines
- **Class Diagrams**: Design patterns and dependencies

Render with any Mermaid-compatible viewer or GitHub's native rendering.

## Maintenance

This documentation should be updated when:
- Adding/modifying database tables or fields
- Changing API endpoints or contracts
- Updating business logic or state machines
- Modifying rating calculation algorithms
- Introducing new design patterns
- Changing development workflows

**Documentation debt is technical debt.** Keep docs synchronized with code.

---

For project setup and general information, see the [main README](../README.md).
