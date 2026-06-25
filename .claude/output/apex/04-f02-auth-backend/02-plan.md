# Step 02: Plan

**Task:** Implement F02 authentication backend
**Started:** 2026-06-24T19:25:04Z

---

## Implementation Plan

### Overview
Add multi-tenant authentication to QRify backend: JWT-based login/register/logout with HttpOnly cookies, role-based middleware, and transactional company+admin creation.

### Prerequisites
- [x] Worktree on `feat/F02-auth-backend` already exists
- [x] Dependencies: hono 4.12 (jwt, cookie built-in) + zod 4.4.3 already installed
- [x] `src/config/env.ts` - JWT_SECRET added to Zod schema (done)
- [x] `src/config/auth.config.ts` - Auth constants created (done)

---

### File Changes

#### `qrify-backend/.env.example` (EDIT)
- Add `JWT_SECRET=your-secret-key-minimum-32-characters-long` line

#### `qrify-backend/src/utils/validate.ts` (NEW FILE)
- Export `validateOrThrow<T>(schema, data)` using Zod's `safeParseAsync`
- Convert ZodError to `ValidationError` with field-level messages

#### `qrify-backend/src/services/id.service.ts` (NEW FILE)
- Class `IdService` with `generate(): string` wrapping `crypto.randomUUID()`

#### `qrify-backend/src/services/password.service.ts` (NEW FILE)
- Class `PasswordService` with `hash(password)` and `verify(password, hash)` using `Bun.password`

#### `qrify-backend/src/services/clock.service.ts` (NEW FILE)
- Class `ClockService` with `now(): Date` and `nowISO(): string`

#### `qrify-backend/src/services/token.service.ts` (NEW FILE)
- Class `TokenService` with:
  - `createToken(payload)` - sign JWT via `hono/jwt`
  - `verifyToken(token)` - verify JWT
  - `setCookie(c, token)` - set HttpOnly cookie via `hono/cookie`
  - `clearCookie(c)` - delete cookie
  - `extractToken(c)` - get cookie value

#### `qrify-backend/src/modules/auth/auth.types.ts` (NEW FILE)
- Interface `JwtPayload` (sub, role, companyId, status, iat, exp)
- `declare module 'hono' { interface ContextVariableMap { user: JwtPayload } }`
- DTO interfaces: `RegisterCompanyDTO`, `RegisterEmployeeDTO`, `LoginDTO`
- Response interfaces: `UserResponse`, `AuthResponse`

#### `qrify-backend/src/modules/auth/auth.schema.ts` (NEW FILE)
- `registerCompanySchema` - Zod object for company reg (name, code, timezone, admin fields)
- `registerEmployeeSchema` - Zod object for employee reg (code, name, email, password)
- `loginSchema` - Zod object for login (email, password)

#### `qrify-backend/src/modules/auth/auth.errors.ts` (NEW FILE)
- EmailAlreadyExistsError, CompanyCodeAlreadyExistsError, InvalidCredentialsError
- AccountPendingError, AccountRejectedError, AccountSuspendedError
- CompanyNotFoundError, CompanySuspendedError

#### `qrify-backend/src/modules/auth/auth.service.ts` (NEW FILE)
- Class `AuthService` taking DB adapter + repos + services in constructor
- `registerCompany(dto)` - transactional via `db.transaction()` with adapter.run()
- `registerEmployee(dto)` - find company → check email → create PENDING employee
- `login(dto)` - find by email → verify password → check status → sign JWT → set cookie
- `getUser(userId)` - find by id → return `toUserResponse()` (no password_hash)
- Helper `toUserResponse()` mapping snake_case DB to camelCase API

#### `qrify-backend/src/modules/auth/auth.routes.ts` (NEW FILE)
- `createAuthRouter()` factory wiring all dependencies
- `POST /register/company` - validate → authService.registerCompany → 201
- `POST /register/employee` - validate → authService.registerEmployee → 201
- `POST /login` - validate → login → set cookie from tokenService → 200
- `POST /logout` - clearCookie → 200
- `GET /me` - authMiddleware → authService.getUser → 200

#### `qrify-backend/src/middlewares/auth.middleware.ts` (NEW FILE)
- `authMiddleware()` - extract JWT from cookie → verify → `c.set('user', payload)` → next
- Throw `UnauthorizedError` if no token or invalid token

#### `qrify-backend/src/middlewares/role.middleware.ts` (NEW FILE)
- `roleMiddleware(...roles)` - check `c.get('user').role` → throw `ForbiddenError`

#### `qrify-backend/src/middlewares/tenant.middleware.ts` (NEW FILE)
- `tenantMiddleware(getResourceCompanyId)` - SUPER_ADMIN bypass → cross-tenant check

#### `qrify-backend/src/index.ts` (EDIT)
- Import `createAuthRouter` from auth routes
- Add `app.route('/api/v1/auth', createAuthRouter())` before error handler

---

### Testing Strategy

#### New test files:
- `qrify-backend/src/modules/auth/auth.service.test.ts` - AuthService unit tests
- `qrify-backend/src/modules/auth/auth.routes.test.ts` - Integration tests
- `qrify-backend/src/middlewares/auth.middleware.test.ts` - Middleware tests

---

### Acceptance Criteria Mapping
- [x] AC1 (JWT HttpOnly cookie): TokenService.setCookie/clearCookie, auth.middleware.ts
- [x] AC2 (POST /register/company transactional): AuthService.registerCompany with db.transaction()
- [x] AC3 (POST /register/employee): AuthService.registerEmployee creates PENDING user
- [x] AC4 (POST /login): AuthService.login verifies password, sets cookie
- [x] AC5 (POST /logout): TokenService.clearCookie
- [x] AC6 (GET /me): AuthService.getUser, authMiddleware on route
- [x] AC7 (Auth middleware): auth.middleware.ts with cookie extraction
- [x] AC8 (Role middleware): role.middleware.ts with role check
- [x] AC9 (UPPERCASE status/role): Constants in auth.schema.ts + service
- [x] AC10 (Password hashing): PasswordService with Bun.password
- [x] AC11 (Tests passing): Three test files covering all paths

---

### Risks & Considerations
- **Transaction async mismatch**: bun:sqlite `db.transaction(fn)` expects sync fn; use adapter.run() directly
- **Zod v4 API**: Verify `safeParseAsync`, `ZodError` in v4.4.3
- **Token expiry**: JWT exp set manually based on COOKIE_MAX_AGE

---

## Step Complete
**Status:** ✓ Complete
**Files planned:** 14 new + 3 edits + 3 test files
**Tests planned:** 3 test files
**Next:** step-03-execute.md
