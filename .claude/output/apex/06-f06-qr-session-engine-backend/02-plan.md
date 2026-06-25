# Step 02: Plan

**Task:** F06 QR session engine backend
**Started:** 2026-06-25T09:35:24Z

---

## Implementation Plan: F06 QR Session Engine Backend

### Overview
Create the `qr` module with service that lazily generates QR sessions based on company schedule and time windows, plus two endpoints: public active-QR (by company code, no auth) and admin QR status.

### API Endpoints (PROJECT.md §15.5)
- `GET /public/companies/:companyCode/active-qr` — No auth: active QR for display
- `GET /company/qr/status` — COMPANY_ADMIN: current QR status

### Prerequisites
All repository contracts + SQLite implementations already exist (qr-session, company, schedule).

---

### File Changes

#### `src/config/qr.config.ts` (NEW)
QR window timing constants:
```typescript
export const QR_CONFIG = {
  ARRIVAL_WINDOW_OPEN_MINUTES: 30,   // QR appears 30min before start
  ARRIVAL_WINDOW_CLOSE_MINUTES: 30,  // QR expires 30min after start
  BREAK_WINDOW_OPEN_MINUTES: 15,     // QR appears 15min before break
  BREAK_WINDOW_CLOSE_MINUTES: 15,    // QR expires 15min after break start
  DEPARTURE_WINDOW_OPEN_MINUTES: 30, // QR appears 30min before end
  DEPARTURE_WINDOW_CLOSE_MINUTES: 15,// QR expires 15min after end
  TOKEN_BYTES: 32,                   // 256-bit random token
}
```

#### `src/modules/qr/qr.types.ts` (NEW)
- `ActiveQrResponse`: `sessionId, companyId, eventType, token, validFrom, validUntil, workDate`
- `toActiveQrResponse(session, rawToken)` converter
- Follows camelCase pattern from `companies.types.ts:22-31`

#### `src/modules/qr/qr.errors.ts` (NEW)
- `CompanyNotActiveError extends ForbiddenError`
- `NoScheduleError extends NotFoundError`
- `NotWorkingDayError extends BadRequestError`
- `NoActiveQrError extends NotFoundError`
- `CompanyCodeNotFoundError extends NotFoundError`
- Follows `companies.errors.ts:1-13` pattern

#### `src/modules/qr/qr.schema.ts` (NEW)
Minimal — QR creation is system-triggered. Empty or just re-export config.

#### `src/modules/qr/qr.service.ts` (NEW)
`QrSessionService` with 4 injected dependencies:
- `companyRepo: CompanyRepository`
- `scheduleRepo: ScheduleRepository`
- `qrSessionRepo: QrSessionRepository`
- `clockService: ClockService`

**Key methods:**
- `determineWorkDate(timezone)` — `Intl.DateTimeFormat('en-CA',{timeZone})` → YYYY-MM-DD
- `getLocalTimeString(timezone)` — `Intl.DateTimeFormat` → HH:MM in company TZ
- `determineActiveEventType(schedule, localTime)` — checks each window in order: ARRIVAL→BREAK_START→BREAK_END→DEPARTURE
- `toMinutes(time)` — "HH:MM" → minutes since midnight helper
- `generateToken()` — `crypto.randomBytes(32).toString('hex')` + SHA-256 hash
- `getOrCreateActiveSession(companyId)` — core engine: verify company→schedule→workday→window→expire old→create new
- `getActiveQrByCompanyCode(companyCode)` — company lookup + delegate to above

**Design decision:** Always expire old ACTIVE session + create new one to ensure raw token is available (only hash is stored). Short windows make this acceptable.

#### `src/modules/qr/qr.routes.ts` (NEW)
Two factory functions sharing same service construction:
- `createQrRouter(dbOverride?)` — admin routes: `GET /status` → COMPANY_ADMIN, returns null gracefully
- `createPublicQrRouter(dbOverride?)` — public routes: `GET /:companyCode/active-qr` → no auth

Pattern follows `companies.routes.ts:12-40`

#### `src/config/qr.config.ts` (NEW)
Window constants.

#### `src/index.ts` (MODIFY)
Add imports + mount both routers:
```typescript
import { createQrRouter, createPublicQrRouter } from './modules/qr/qr.routes'
app.route('/api/v1/company/qr', createQrRouter())
app.route('/api/v1/public/companies', createPublicQrRouter())
```

---

### Testing Strategy

#### `src/modules/qr/qr.service.test.ts` (NEW)
- `getOrCreateActiveSession` happy path → session with token
- Company suspended → `CompanyNotActiveError`
- No schedule → `NoScheduleError`
- Non-working day → `NotWorkingDayError`
- Outside any window → `NoActiveQrError`
- `getActiveQrByCompanyCode` valid → active QR
- `getActiveQrByCompanyCode` invalid → `CompanyCodeNotFoundError`

#### `src/modules/qr/qr.routes.test.ts` (NEW)
- `GET /status` auth+admin+active → 200
- `GET /status` auth+admin+no-qr → 200 null
- `GET /status` no auth → 401
- `GET /status` wrong role → 403
- `GET /:companyCode/active-qr` valid → 200
- `GET /:companyCode/active-qr` invalid code → 404
- `GET /:companyCode/active-qr` suspended → 403

---

### Acceptance Criteria Mapping
- [ ] AC1: Service generates session with random token, stores hash → `qr.service.ts:generateToken`
- [ ] AC2: Active QR endpoint resolves correct event type → `determineActiveEventType`
- [ ] AC3: Admin status returns current QR or null → `qr.routes.ts:GET /status`
- [ ] AC4: Public endpoint works via company code (no auth) → `createPublicQrRouter`
- [ ] AC5: Errors for non-working days, no schedule, suspended → `qr.errors.ts`
- [ ] AC6: Auth/role guards present → route middleware
- [ ] AC7: Tests pass → 2 test files

---

### Risks
- Raw token only available at creation. Design: always expire+recreate.
- Timezone: `Intl.DateTimeFormat` works in Bun, no external deps.
- UNIQUE constraint race: handled by INSERT failure → retry with new token.
