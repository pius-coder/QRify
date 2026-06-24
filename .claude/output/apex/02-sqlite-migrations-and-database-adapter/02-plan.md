# Step 02: Plan

**Task:** F01 SQLite migrations and database adapter
**Started:** 2026-06-24T14:48:00Z

---

## Planning Progress

_Implementation plan will be written here..._

## Implementation Plan: F01 SQLite migrations and database adapter

### Overview
Create the complete database layer: adapter, repository contracts & SQLite implementations, migration system with SQL files, seed script, and factory wiring.

### Prerequisites
- [x] Bun SQLite is built-in (no dependencies needed)
- [x] Environment validation structure exists in src/config/env.ts

---

### File Changes

#### `src/config/env.ts` (MODIFY)
- Add `DATABASE_URL` env var (default: `./data/qrify.sqlite`)
- Add `DB_TYPE` env var (default: `sqlite`)

#### `src/database/database.types.ts` (NEW)
- Define `DbConfig` interface (type, url)
- Define `QueryResult<T>` interface (rows, rowCount)
- Define `DatabaseAdapter` interface (connect, disconnect, query, run, transaction)

#### `src/database/adapters/sqlite.adapter.ts` (NEW)
- Implement `DatabaseAdapter` using `bun:sqlite`
- Enable PRAGMA foreign_keys = ON and journal_mode = WAL on connect
- Implement query() for SELECT with `.all()`/`.get()`
- Implement run() for INSERT/UPDATE/DELETE
- Implement transaction() using `db.transaction()`
- Map SQLite errors to ApiError classes

#### `src/database/database.factory.ts` (NEW)
- Create singleton adapter instance
- Factory function `createDatabase(type, url)` with switch on DB_TYPE
- Connect on creation

#### `src/database/repositories/contracts/company.repository.ts` (NEW)
- Interface: findById, findByCode, findAll, create, update, existsByCode
- Methods return plain objects (no SQLite types)

#### `src/database/repositories/contracts/user.repository.ts` (NEW)
- Interface: findById, findByEmail, findAllByCompany, create, updateStatus, existsByEmail

#### `src/database/repositories/contracts/schedule.repository.ts` (NEW)
- Interface: findByCompanyId, upsert, findDaysByScheduleId, upsertDays

#### `src/database/repositories/contracts/qr-session.repository.ts` (NEW)
- Interface: findActiveByCompanyAndType, create, expireById, revokeByCompanyAndDate

#### `src/database/repositories/contracts/scan-event.repository.ts` (NEW)
- Interface: create, findByUserAndDate, findLastByUserAndType

#### `src/database/repositories/contracts/attendance.repository.ts` (NEW)
- Interface: findByUserAndDate, create, update, findByCompanyAndDate, findAllByUser

#### `src/database/repositories/contracts/statistics.repository.ts` (NEW)
- Interface: getCompanyStats, getAttendanceStats, getEmployeeRankings

#### `src/database/repositories/sqlite/sqlite-company.repository.ts` (NEW)
- Implement CompanyRepository using DatabaseAdapter methods
- Parameterized SQL queries
- Error wrapping

#### `src/database/repositories/sqlite/sqlite-user.repository.ts` (NEW)
- Implement UserRepository
- SQL: SELECT/INSERT/UPDATE on `users` table
- Filter by company_id for multi-tenant isolation

#### `src/database/repositories/sqlite/sqlite-schedule.repository.ts` (NEW)
- Implement ScheduleRepository
- Handle work_schedules and work_schedule_days tables

#### `src/database/repositories/sqlite/sqlite-qr-session.repository.ts` (NEW)
- Implement QrSessionRepository
- Token hash generation and lookup

#### `src/database/repositories/sqlite/sqlite-scan-event.repository.ts` (NEW)
- Implement ScanEventRepository
- Sequence validation queries

#### `src/database/repositories/sqlite/sqlite-attendance.repository.ts` (NEW)
- Implement AttendanceRepository
- Upsert pattern for attendance records

#### `src/database/repositories/sqlite/sqlite-statistics.repository.ts` (NEW)
- Implement StatisticsRepository
- Aggregate queries for stats

#### `migrations/sqlite/001_create_companies.sql` (NEW)
- CREATE TABLE companies
- company_code UNIQUE index

#### `migrations/sqlite/002_create_users.sql` (NEW)
- CREATE TABLE users
- email UNIQUE index
- company_id FK + status index

#### `migrations/sqlite/003_create_work_schedules.sql` (NEW)
- CREATE TABLE work_schedules
- company_id FK

#### `migrations/sqlite/004_create_work_schedule_days.sql` (NEW)
- CREATE TABLE work_schedule_days
- schedule_id FK, unique(schedule_id, weekday)

#### `migrations/sqlite/005_create_qr_sessions.sql` (NEW)
- CREATE TABLE qr_sessions
- token_hash index, company_id + work_date index

#### `migrations/sqlite/006_create_scan_events.sql` (NEW)
- CREATE TABLE scan_events
- user_id + scanned_at index

#### `migrations/sqlite/007_create_attendance_records.sql` (NEW)
- CREATE TABLE attendance_records
- UNIQUE(company_id, user_id, work_date)

#### `migrations/sqlite/008_create_indexes.sql` (NEW)
- All remaining indexes from PROJECT.md §14

#### `scripts/migrate.ts` (NEW)
- Read migration SQL files from `migrations/sqlite/`
- Create `_migrations` tracking table
- Apply unapplied migrations in transaction
- Accept `--reset` flag to re-run from scratch

#### `scripts/seed.ts` (NEW)
- Create demo super admin
- Create sample company
- Create sample employees
- Run migrations first if needed

#### `scripts/reset-database.ts` (NEW)
- Drop all tables
- Re-run migrations

#### `package.json` (MODIFY)
- Add scripts: migrate, seed, reset-db

#### `.env.example` (MODIFY)
- Add DATABASE_URL and DB_TYPE

---

### Testing Strategy

**New tests:**
- `tests/unit/sqlite-adapter.test.ts` - Test connect, query, transaction
- `tests/integration/sqlite-repositories.test.ts` - Test each repository
- `tests/integration/migration-runner.test.ts` - Test migration execution

---

### Acceptance Criteria Mapping
- [x] AC1: Database adapter interface in database.types.ts
- [x] AC2: SQLite adapter in sqlite.adapter.ts
- [x] AC3: PRAGMA foreign_keys and WAL on connect
- [x] AC4: Factory in database.factory.ts
- [x] AC5: 7 repository contracts in repositories/contracts/
- [x] AC6: 7 SQLite implementations in repositories/sqlite/
- [x] AC7: Migration runner in scripts/migrate.ts
- [x] AC8: 8 SQL migration files for all tables + indexes
- [x] AC9: Seed script in scripts/seed.ts
- [x] AC10: Reset script in scripts/reset-database.ts
- [x] AC11: typecheck passes

---

### Risks & Considerations
- Risk 1: bun:sqlite is synchronous, but repository methods return Promises → Wrap sync calls in Promises for adapter interface consistency
- Risk 2: Migration order matters → Numbered SQL files sorted alphabetically
- Risk 3: FK constraints order during reset → Drop views/tables in reverse order

