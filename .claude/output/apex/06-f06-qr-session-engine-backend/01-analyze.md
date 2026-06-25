# Step 01: Analyze

**Task:** F06 QR session engine backend
**Started:** 2026-06-25T09:35:24Z

---

## Context Discovery

### What Already Exists (QR-Specific)

| File | Lines | Contains |
|------|-------|----------|
| `migrations/sqlite/005_create_qr_sessions.sql` | 12 | `qr_sessions` table schema with constraints |
| `migrations/sqlite/006_create_scan_events.sql` | 10 | `scan_events` table (references qr_sessions) |
| `migrations/sqlite/008_create_indexes.sql` | 7 | Indexes on `qr_sessions(company_id, work_date)` and `token_hash` |
| `src/database/repositories/contracts/qr-session.repository.ts` | 18 | `QrSessionData` interface + `QrSessionRepository` interface |
| `src/database/repositories/sqlite/sqlite-qr-session.repository.ts` | 33 | `SqliteQrSessionRepository` with 4 methods |
| `src/database/constants.ts` | 10 | Includes `qr_sessions` and `scan_events` in `ALL_TABLES` |

### What Needs to be Created

| Item | Description |
|------|-------------|
| `src/modules/qr/qr.types.ts` | `QrSessionResponse`, `ActiveQrResponse`, `toQrSessionResponse` |
| `src/modules/qr/qr.errors.ts` | `QrSessionNotFoundError`, `CompanyNotActiveError`, `NoScheduleError`, `NotWorkingDayError`, `NoActiveQrError` |
| `src/modules/qr/qr.schema.ts` | Zod schemas (minimal — QR session creation is system-triggered) |
| `src/modules/qr/qr.service.ts` | `QrSessionService` — session generation, active QR resolution |
| `src/modules/qr/qr.routes.ts` | `createQrRouter(dbOverride?)` — route factory |
| `src/modules/qr/qr.service.test.ts` | Unit tests for QR engine logic |
| `src/modules/qr/qr.routes.test.ts` | Integration tests for QR endpoints |
| `src/config/qr.config.ts` | QR window constants (opening/closing margins) |
| `src/index.ts` (MODIFY) | Wire `app.route('/api/v1/company/qr', ...)` |

### API Endpoints (from PROJECT.md §15.5)
- `GET /public/companies/:companyCode/active-qr` — Public (no auth): returns current active QR for display
- `GET /company/qr/status` — COMPANY_ADMIN: returns QR status for current company

### Patterns To Follow (from existing modules)
- **Types**: camelCase DTOs, `toXxxResponse()` converter from snake_case DB data
- **Errors**: Extend `NotFoundError`, `ForbiddenError`, `BadRequestError` from `src/utils/errors.ts`
- **Service**: Constructor-injected repos, async methods, `companyId` param from JWT
- **Routes**: `createXxxRouter(dbOverride?)` factory, `authMiddleware()`, `roleMiddleware('COMPANY_ADMIN')`
- **Tests**: `createTestDb()` in `beforeEach`, Bun test runner
- **Route registration**: `app.route('/api/v1/path', createXxxRouter())` in `src/index.ts`

### Inferred Acceptance Criteria
- [ ] AC1: QR session service can generate session with random token, store hash, return response
- [ ] AC2: Active QR endpoint resolves correct event type based on company timezone and current time
- [ ] AC3: Admin QR status endpoint returns current active QR or 404
- [ ] AC4: Public active QR endpoint works via company code (no auth)
- [ ] AC5: Non-working days, missing schedules, suspended companies return appropriate errors
- [ ] AC6: All endpoints have auth/role guards as specified
- [ ] AC7: Tests pass for service and routes
