# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Child DOX Index

This project is not yet indexed. Before continuing you must scan the project, build the DOX tree and replace this message with the actual index. Go deep and scan files recursively to properly evaluate complexity and create nested DOX files where needed.

# QRify

Attendance tracking app with multi-tenant QR code scanning.

## Tech Stack

- Backend: Hono + TypeScript on Bun, SQLite, repository pattern
- Frontend: SvelteKit + TypeScript
- Database: SQLite via bun:sqlite, no ORM, repository pattern with contracts

## Commands

- `cd qrify-backend && bun run dev` — Dev server
- `cd qrify-backend && bun test` — Run tests
- `cd qrify-backend && bun run typecheck` — TypeScript check
- `cd qrify-backend && bun run migrate` — Run migrations
- `cd qrify-backend && bun run seed` — Seed demo data
- `cd qrify-frontend && bun run dev` — Dev server
- `cd qrify-frontend && bun run check` — Type check
- `cd qrify-frontend && bun run lint` — Lint
- `cd qrify-frontend && bun run format` — Format

## Auth Module Structure

### Authentication Flow
- JWT stored in HttpOnly cookie (`qrify_token`), not in response body
- JWT payload: `{ sub, role, companyId, status, iat, exp }`
- Password hashing via `Bun.password.hash` (Argon2id)
- SameSite=Lax, Secure in production, 7-day expiry

### API Endpoints (`/api/v1/auth`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /register/company` | No | Creates company + COMPANY_ADMIN in transaction |
| `POST /register/employee` | No | Creates EMPLOYEE with PENDING status |
| `POST /login` | No | Validates credentials, sets JWT cookie |
| `POST /logout` | No | Clears JWT cookie |
| `GET /me` | Yes | Returns current user |

### Directory Structure
- `src/services/` — Business services (id, password, clock, token)
- `src/modules/auth/` — Auth module (types, schema, errors, service, routes)
- `src/middlewares/` — Middleware (auth from cookie, role guard, tenant isolation)

### Key Patterns
- `createAuthRouter(dbOverride?)` factory wires dependencies, accepts optional test DB
- `AuthService` takes `DatabaseAdapter` directly for transactional inserts
- All errors extend `ApiError` from `src/utils/errors.ts`
- Response format: `{ success: true, data }` or `{ success: false, error: { code, message } }`
- `import type` for type-only imports (verbatimModuleSyntax)

## Frontend Module Conventions

### API Client Pattern
- `src/lib/api/api-client.ts` — Central client with `apiGet`, `apiPost`, `apiPut`
- Each domain gets a dedicated module: `src/lib/api/{domain}.api.ts`
- Functions wrap `apiGet`/`apiPost`/`apiPut` with correct paths and typed returns
- Uses `credentials: 'include'` for cookie-based auth

### Store Pattern
- `src/lib/stores/{domain}.store.ts` — Writable + derived store
- State interface with domain data, isLoading, error
- Methods: load, create/update, clearError, clearSuccess
- Returns `Promise<boolean>` for form submission flow

### Types Pattern
- `src/lib/types/{domain}.types.ts` — DTOs and response interfaces
- camelCase naming matching backend camelCase conversion
- Separate interfaces for data models, DTOs, and response shapes

### Page Pattern
- `src/routes/{role}/{feature}/+page.svelte` — Route per role and feature
- Form handling with `$state`, `onMount` for init, `goto` for redirect
- Error display with conditional `{#if}` blocks
- Success/loading states managed by stores

## Company Profile Module (Frontend)

### API Endpoints Consumed (`/api/v1/company`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /company` | COMPANY_ADMIN | Returns company profile |
| `PUT /company` | COMPANY_ADMIN | Updates name and timezone |
| `GET /company/code` | COMPANY_ADMIN | Returns company code |

### Frontend Files
| File | Purpose |
|------|---------|
| `src/lib/types/company.types.ts` | `CompanyProfile`, `UpdateCompanyDTO`, `CompanyCodeResponse` |
| `src/lib/api/company.api.ts` | `getCompany()`, `updateCompany()`, `getCompanyCode()` |
| `src/lib/stores/company.store.ts` | `company` store with `load()`, `update()` |
| `src/routes/admin/company/+page.svelte` | Company profile view/edit page |

## Employee Management Module (Backend)

### API Endpoints (`/api/v1/employees`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /` | COMPANY_ADMIN | Lists all EMPLOYEE role users in company |
| `GET /:id` | COMPANY_ADMIN | Returns single employee by ID |
| `PUT /:id` | COMPANY_ADMIN | Updates employee firstName, lastName, email |
| `PATCH /:id/status` | COMPANY_ADMIN | Updates employee status (PENDING→ACTIVE, ACTIVE→SUSPENDED, etc.) |

### Module Files
| File | Purpose |
|------|---------|
| `src/modules/employees/employees.types.ts` | `EmployeeResponse`, `UpdateEmployeeDTO`, `UpdateEmployeeStatusDTO`, `toEmployeeResponse` |
| `src/modules/employees/employees.errors.ts` | `EmployeeNotFoundError`, `EmployeeNotInCompanyError`, `InvalidStatusTransitionError`, `CannotModifyCompanyAdminError` |
| `src/modules/employees/employees.schema.ts` | Zod schemas with status transition validation |
| `src/modules/employees/employees.service.ts` | `EmployeeService` with list, getById, update, updateStatus |
| `src/modules/employees/employees.routes.ts` | `createEmployeesRouter(dbOverride?)` factory |

### Key Behaviors
- Only COMPANY_ADMIN role can manage employees
- Only EMPLOYEE role users are shown in list; COMPANY_ADMIN users are protected
- Status transitions validated: PENDING→ACTIVE|REJECTED, ACTIVE→SUSPENDED, SUSPENDED→ACTIVE
- Email uniqueness checked on update via `existsByEmail`


## Employee Management Module (Frontend)

### API Endpoints Consumed (`/api/v1/employees`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /employees` | COMPANY_ADMIN | Lists all EMPLOYEE role users in company |
| `GET /employees/:id` | COMPANY_ADMIN | Returns single employee by ID |
| `PUT /employees/:id` | COMPANY_ADMIN | Updates employee firstName, lastName, email |
| `PATCH /employees/:id/status` | COMPANY_ADMIN | Updates employee status |

### Frontend Files
| File | Purpose |
|------|---------|
| `src/lib/types/employee.types.ts` | `EmployeeResponse`, `UpdateEmployeeDTO`, `UpdateEmployeeStatusDTO`, `EmployeeListResponseData`, `EmployeeResponseData` |
| `src/lib/api/employee.api.ts` | `listEmployees()`, `getEmployee()`, `updateEmployee()`, `updateEmployeeStatus()` |
| `src/lib/stores/employee.store.ts` | `employees` store with `load()`, `updateStatus()`, error auto-clear |
| `src/routes/admin/employees/+page.svelte` | Employee list with status filter, search, approve/reject/suspend/reactivate actions |

### Key Behaviors
- Only EMPLOYEE role users shown; COMPANY_ADMIN users not visible
- Status filter dropdown and case-insensitive search by name/email
- Confirm dialog before status change actions
- In-place store update on status change (no full reload)
- Error auto-clears after 5 seconds; success message dismissible
- Loading indicator ("Updating...") shown during status mutations
- PATCH method used for status changes via `apiPatch` helper

## Super Admin Module (Backend)

### API Endpoints (`/api/v1/super-admin`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /companies` | SUPER_ADMIN | Lists companies with search, status filter, pagination |
| `GET /companies/:id` | SUPER_ADMIN | Returns company detail |
| `PATCH /companies/:id/status` | SUPER_ADMIN | Updates company status (ACTIVE↔SUSPENDED) |
| `GET /statistics` | SUPER_ADMIN | Returns aggregate platform statistics |

### Module Files
| File | Purpose |
|------|---------|
| `src/modules/super-admin/super-admin.types.ts` | `CompanyListResponse`, `CompanyDetailResponse`, `UpdateCompanyStatusDTO`, `SuperAdminStatisticsResponse`, `PaginationMeta`, mapper functions |
| `src/modules/super-admin/super-admin.errors.ts` | `SuperAdminCompanyNotFoundError`, `InvalidCompanyStatusTransitionError` |
| `src/modules/super-admin/super-admin.schema.ts` | Zod schemas for status update and query params |
| `src/modules/super-admin/super-admin.service.ts` | `SuperAdminService` with list, get, updateStatus, getStatistics |
| `src/modules/super-admin/super-admin.routes.ts` | `createSuperAdminRouter(dbOverride?)` factory |

### Key Behaviors
- Only SUPER_ADMIN role can access all endpoints
- `CompanyRepository.searchCompanies()` supports dynamic WHERE with LIKE for name/code, status filter, LIMIT/OFFSET pagination
- Status transitions validated: ACTIVE↔SUSPENDED only; no-op returns current data
- Statistics use aggregate COUNT queries across companies, users, scan_events, attendance_records
- `searchCompanies` added to `CompanyRepository` contract + `SqliteCompanyRepository` implementation

## Work Schedule Module (Frontend)

### API Endpoints Consumed (`/api/v1/company/schedule`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /company/schedule` | COMPANY_ADMIN | Returns work schedule or 404 |
| `PUT /company/schedule` | COMPANY_ADMIN | Creates or updates work schedule |

### Frontend Files
| File | Purpose |
|------|---------|
| `src/lib/types/schedule.types.ts` | `ScheduleResponse`, `UpdateScheduleDTO`, `WEEKDAY_LABELS` |
| `src/lib/api/schedule.api.ts` | `getSchedule()`, `upsertSchedule()` |
| `src/lib/stores/schedule.store.ts` | `schedule` store with `load()`, `update()`, 404 handling |
| `src/routes/admin/schedule/+page.svelte` | Work schedule view/edit page with weekday checkboxes, break toggle |

### Key Behaviors
- Store handles 404 (no schedule yet) gracefully by setting `schedule=null` without error
- Break toggle: both breakStartTime/breakEndTime are null when break is disabled
- Weekdays use numbers 1-7 (Mon-Sun), sorted ascending
- Time format: HH:MM 24h via `<input type="time">`
- All validation handled by backend Zod schema; no frontend schema validation

## QR Session Module (Backend)

### API Endpoints
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v1/company/qr/status` | COMPANY_ADMIN | Returns active QR session status for current user's company |
| `GET /api/v1/public/companies/:companyCode/active-qr` | No | Returns active QR for scanning kiosk |

### Module Files (`src/modules/qr/`)
| File | Purpose |
|------|---------|
| `qr.types.ts` | `ActiveQrResponse`, `toActiveQrResponse` |
| `qr.errors.ts` | `CompanyNotActiveError`, `NoScheduleError`, `NotWorkingDayError`, `NoActiveQrError`, `CompanyCodeNotFoundError` |
| `qr.schema.ts` | Zod schemas (currently stub) |
| `qr.service.ts` | `QrSessionService` with `getOrCreateActiveSession`, `getActiveQrByCompanyCode` |
| `qr.routes.ts` | `createQrRouter` (admin) and `createPublicQrRouter` (public) factories |
| `qr.service.test.ts` | 17 tests covering window detection, session lifecycle, error paths |
| `qr.routes.test.ts` | 6 tests covering auth guards, valid/invalid codes, company status |

### Key Behaviors
- Sessions created lazily on-demand when active QR is requested
- 4 event type windows: ARRIVAL, BREAK_START, BREAK_END, DEPARTURE
- Window config in `src/config/qr.config.ts` (arrivalOpen/arrivalClose minutes, etc.)
- Timezone-aware via `Intl.DateTimeFormat` — no external library needed
- Token: 32-byte random → hex, stored as SHA-256 hash (raw token only available in response)
- INSERT OR REPLACE handles UNIQUE(company_id, work_date, event_type) constraint
- Window order: ARRIVAL → BREAK_START → BREAK_END → DEPARTURE; first match wins
- Break windows skipped if schedule lacks breakStartTime/breakEndTime

### Route Factories
- `createQrRouter(dbOverride?)` — Mounted at `/api/v1/company/qr`, guarded by auth middleware + COMPANY_ADMIN role
- `createPublicQrRouter(dbOverride?)` — Mounted at `/api/v1/public/companies`, no auth, for scanning kiosk

## Rules

- **Worktrees** — [.agents/rules/worktrees.md](.agents/rules/worktrees.md) — Worktree usage for parallel AI agents

## Universal Rules

- NEVER modify files outside your assigned worktree
- ALWAYS check `git worktree list` before starting to confirm which worktree you're in
- ALWAYS use parameterized SQL queries (never string interpolation for WHERE clauses)
- ALL status/role values must be UPPERCASE (e.g., `'ACTIVE'`, `'EMPLOYEE'`, `'SUPER_ADMIN'`)
- NEVER use TypeScript `any` type — use `unknown` or proper types instead
