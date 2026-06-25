# Step 01: Analyze

**Task:** Implement F02 authentication backend
**Started:** 2026-06-24T19:25:04Z

---

## Context Discovery

### Related Files Found
| File | Lines | Contains |
|------|-------|----------|
| `qrify-backend/src/index.ts` | 1-49 | Hono app entry, CORS, logger, error handler, health route |
| `qrify-backend/src/config/env.ts` | 1-13 | Zod env validation (PORT, CORS_ORIGIN, NODE_ENV, DATABASE_URL, DB_TYPE) |
| `qrify-backend/src/utils/errors.ts` | 1-81 | ApiError hierarchy + formatErrorResponse |
| `qrify-backend/src/database/database.types.ts` | 1-19 | DatabaseAdapter interface (connect, query, run, transaction) |
| `qrify-backend/src/database/database.factory.ts` | 1-38 | getDatabase() singleton factory |
| `qrify-backend/src/database/adapters/sqlite.adapter.ts` | 1-51 | SQLite adapter with WAL, FK, transaction support |
| `qrify-backend/src/database/test-utils.ts` | 1-20 | In-memory SQLite test DB with migrations |
| `qrify-backend/src/database/repositories/contracts/user.repository.ts` | 1-21 | UserRepository interface |
| `qrify-backend/src/database/repositories/contracts/company.repository.ts` | 1-18 | CompanyRepository interface |
| `qrify-backend/src/database/repositories/sqlite/sqlite-user.repository.ts` | 1-41 | SQLite UserRepository implementation |
| `qrify-backend/src/database/repositories/sqlite/sqlite-company.repository.ts` | 1-44 | SQLite CompanyRepository implementation |
| `qrify-backend/migrations/sqlite/001_create_companies.sql` | 1-9 | Companies table schema |
| `qrify-backend/migrations/sqlite/002_create_users.sql` | 1-12 | Users table schema |
| `qrify-backend/package.json` | 1-27 | Dependencies: hono ^4.12.27, zod ^4.4.3 |
| `qrify-backend/tsconfig.json` | 1-30 | Strict, verbatimModuleSyntax, bun types |
| `qrify-backend/.env.example` | 1-12 | Current env template (missing JWT_SECRET) |

### Patterns Observed
- **Error handling**: Custom ApiError extends HTTPException at `errors.ts:4`, formatErrorResponse at `errors.ts:62`
- **DB access**: Singleton adapter via `getDatabase()`, repos receive adapter in constructor
- **Response format**: `{ success: true, data }` success, `{ success: false, error: { code, message } }` error
- **API prefix**: All routes under `/api/v1/`
- **Transactions**: `adapter.transaction(fn)` wraps bun:sqlite synchronous transaction at `sqlite.adapter.ts:48`
- **UPPERCASE**: All status/role values UPPERCASE (ACTIVE, SUSPENDED, EMPLOYEE, COMPANY_ADMIN, SUPER_ADMIN)
- **Testing**: `bun:test` (describe/it/expect), in-memory SQLite via `createTestDb()`

### Database Schema
- **companies**: id TEXT PK, name TEXT, company_code TEXT UNIQUE, timezone TEXT, status TEXT CHECK('ACTIVE','SUSPENDED')
- **users**: id TEXT PK, company_id FK→companies, email TEXT UNIQUE, password_hash TEXT, role TEXT, status TEXT

### Inferred Acceptance Criteria
- [ ] JWT auth with HttpOnly cookies on /api/v1/auth/*
- [ ] POST /register/company creates company + admin in transaction
- [ ] POST /register/employee creates pending employee under company
- [ ] POST /login validates credentials, sets JWT cookie
- [ ] POST /logout clears JWT cookie
- [ ] GET /me returns current authenticated user
- [ ] Auth middleware reads JWT from cookie, verifies, sets c.get('user')
- [ ] Role middleware guards endpoints by user role
- [ ] All status/role values UPPERCASE
- [ ] Tests pass for auth service, routes, and middleware
