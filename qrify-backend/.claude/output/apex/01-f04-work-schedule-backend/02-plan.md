# Implementation Plan: F04 Work Schedule Backend

## File-by-File Strategy

### 1. `src/modules/schedules/schedules.types.ts`
- `ScheduleResponse` interface with camelCase fields
- `UpdateScheduleDTO` interface for validated input
- `toScheduleResponse(schedule, days)` mapper function
- Weekday display mapping (1=Monday, etc.)

### 2. `src/modules/schedules/schedules.schema.ts`
- Time string validation (HH:MM format)
- `updateScheduleSchema` Zod object:
  - `startTime`: string, HH:MM
  - `breakStartTime`: string | null, HH:MM
  - `breakEndTime`: string | null, HH:MM
  - `endTime`: string, HH:MM
  - `lateToleranceMinutes`: number, >= 0
  - `weekdays`: array of numbers 1-7, min 1 item
  - Refinement: time ordering validation
  - Refinement: break times must be both present or both null

### 3. `src/modules/schedules/schedules.errors.ts`
- `ScheduleNotFoundError` extends NotFoundError
- `CompanySuspendedForScheduleError` extends ForbiddenError
- `InvalidTimeOrderError` extends BadRequestError

### 4. `src/modules/schedules/schedules.service.ts`
- Constructor takes `CompanyRepository` + `ScheduleRepository`
- `getSchedule(companyId)`: find schedule + days, throw if not found
- `upsertSchedule(companyId, dto)`: check company exists + active, upsert schedule + days

### 5. `src/modules/schedules/schedules.routes.ts`
- `createScheduleRouter(dbOverride?)` factory
- `GET /` with authMiddleware + roleMiddleware('COMPANY_ADMIN')
- `PUT /` with authMiddleware + roleMiddleware('COMPANY_ADMIN')
- Register at `/api/v1/company/schedule`

### 6. `src/modules/schedules/schedules.service.test.ts`
- Tests for getSchedule: returns schedule, throws not found
- Tests for upsertSchedule: creates, updates, throws for suspended company, throws for non-existent company

### 7. `src/modules/schedules/schedules.routes.test.ts`
- Tests for GET /api/v1/company/schedule: 200 with schedule, 401 without auth, 403 for employee
- Tests for PUT /api/v1/company/schedule: 200 with valid data, 422 with invalid data, 403 for employee

### 8. `src/index.ts` (modify)
- Import `createScheduleRouter`
- Register: `app.route('/api/v1/company/schedule', createScheduleRouter())`
