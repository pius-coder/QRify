# APEX Analysis: 04-f03-company-profile-backend

## Task
F03 company profile backend

## Status
Complete

---

## Codebase Context

### Current State
This worktree is a fresh checkout from `main`. It contains:
- Foundation layer: database adapter, factories, repositories, migrations
- Basic Hono app in `src/index.ts` with health endpoint, CORS, error handling
- `src/config/env.ts` - basic env config (no JWT_SECRET)
- `src/utils/errors.ts` - ApiError hierarchy
- All repository contracts and SQLite implementations
- No services, no middlewares, no modules, no auth infrastructure

### F02 Auth Backend (Prerequisite Dependency)
The `feat/F02-auth-backend` branch contains the auth infrastructure needed:
- `src/services/` - id.service, password.service, token.service, clock.service
- `src/middlewares/` - auth.middleware, role.middleware, tenant.middleware
- `src/modules/auth/` - auth module (types, errors, schema, service, routes)
- `src/types/` - auth.types, hono.types
- `src/config/auth.config.ts` - JWT/auth config
- Updated `src/index.ts` with auth routes mounted
- Updated `src/config/env.ts` with JWT_SECRET

### F03 Company Profile Requirements (from PROJECT.md)

**US-F03-01 — Consult company info** (P0)
- `GET /company` → company info for authenticated company admin
- Only their own company (from JWT companyId), no cross-tenant
- Shows: name, company_code, timezone, status

**US-F03-02 — Modify company** (P1)
- `PUT /company` → update name, timezone
- Only company admin can modify
- Company code NOT modifiable
- Suspended company cannot be modified

**US-F03-03 — Consult company code** (P0)
- `GET /company/code` → company code for display/copy
- Only company admin can see it
- Code not modifiable in MVP

### API Endpoints (from PROJECT.md §15.2)
```
GET  /api/v1/company
PUT  /api/v1/company
GET  /api/v1/company/code
```

### Module Pattern (from F02 auth)
The F02 auth module established this pattern:
```
modules/<name>/
├── <name>.types.ts   — DTOs, response types
├── <name>.errors.ts  — Domain errors extending ApiError subclasses
├── <name>.schema.ts  — Zod validation schemas
├── <name>.service.ts — Business logic (constructor injection of deps)
├── <name>.routes.ts  — create<Name>Router(dbOverride?) factory
├── <name>.service.test.ts — Unit tests
└── <name>.routes.test.ts  — Integration tests
```

### Existing Services (from F02)
- `IdService` — `generate()` returns `crypto.randomUUID()`
- `PasswordService` — `hash()` / `verify()` via `Bun.password.hash` (Argon2id)
- `TokenService` — JWT sign/verify via `hono/jwt`, cookie set/clear via `hono/cookie`
- `ClockService` — `now()` / `nowISO()` date utilities

### Existing Middleware (from F02)
- `authMiddleware()` — reads JWT from `qrify_token` cookie, sets `c.set('user', payload)`
- `roleMiddleware(...roles)` — checks `user.role` against allowed roles
- `tenantMiddleware(getResourceCompanyId)` — blocks cross-tenant access

### Existing Repositories Available
- `CompanyRepository` — `findById`, `findByCode`, `findAll`, `create`, `update`, `existsByCode`
- `UserRepository` — `findById`, `findByEmail`, `findAllByCompany`, `create`, `updateStatus`, `existsByEmail`

### Test Patterns
- Co-located `.test.ts` files using `bun:test` (describe/it/expect/beforeEach)
- `createTestDb()` for in-memory SQLite with all migrations
- Factory functions accept optional `dbOverride` for test injection

---

## Inferred Acceptance Criteria

- [ ] AC1: `GET /api/v1/company` returns company profile for authenticated COMPANY_ADMIN
- [ ] AC2: `GET /api/v1/company` rejects COMPANY_ADMIN from other companies (tenant isolation via JWT companyId)
- [ ] AC3: `PUT /api/v1/company` updates name and timezone
- [ ] AC4: `PUT /api/v1/company` rejects modification of company_code
- [ ] AC5: `PUT /api/v1/company` rejects requests when company is SUSPENDED
- [ ] AC6: `GET /api/v1/company/code` returns company_code for authenticated COMPANY_ADMIN
- [ ] AC7: `GET /api/v1/company/code` rejects non-COMPANY_ADMIN roles
- [ ] AC8: All endpoints respect tenant isolation (use companyId from JWT, never from request)
