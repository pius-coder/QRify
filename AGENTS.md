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

## Rules

- **Worktrees** — [.agents/rules/worktrees.md](.agents/rules/worktrees.md) — Worktree usage for parallel AI agents

## Universal Rules

- NEVER modify files outside your assigned worktree
- ALWAYS check `git worktree list` before starting to confirm which worktree you're in
- ALWAYS use parameterized SQL queries (never string interpolation for WHERE clauses)
- ALL status/role values must be UPPERCASE (e.g., `'ACTIVE'`, `'EMPLOYEE'`, `'SUPER_ADMIN'`)
- NEVER use TypeScript `any` type — use `unknown` or proper types instead
