# Analysis: F04 Work Schedule Backend

## Existing Infrastructure

### ScheduleRepository Contract
`src/database/repositories/contracts/schedule.repository.ts`
- `findByCompanyId(companyId)` → WorkScheduleData | null
- `upsert(companyId, data)` → WorkScheduleData
- `findDaysByScheduleId(scheduleId)` → WorkScheduleDayData[]
- `upsertDays(scheduleId, weekdays)` → WorkScheduleDayData[]

### SqliteScheduleRepository (fully implemented)
- `src/database/repositories/sqlite/sqlite-schedule.repository.ts`
- Handles create-or-update via ON CONFLICT
- Transactional day upsert (delete + re-insert)

### Database Schema (migrations 003, 004)
- `work_schedules`: id, company_id, start_time, break_start_time, break_end_time, end_time, late_tolerance_minutes, created_at, updated_at
- `work_schedule_days`: id, schedule_id, weekday (1-7), UNIQUE(schedule_id, weekday)

### Companies Module (reference pattern)
- `src/modules/companies/companies.routes.ts` - Factory pattern with dbOverride
- `src/modules/companies/companies.service.ts` - Business logic with repo injection
- `src/modules/companies/companies.schema.ts` - Zod validation
- `src/modules/companies/companies.types.ts` - Response types + mappers
- `src/modules/companies/companies.errors.ts` - Custom ApiError subclasses

## Files to Create
1. `src/modules/schedules/schedules.types.ts`
2. `src/modules/schedules/schedules.schema.ts`
3. `src/modules/schedules/schedules.errors.ts`
4. `src/modules/schedules/schedules.service.ts`
5. `src/modules/schedules/schedules.routes.ts`
6. `src/modules/schedules/schedules.service.test.ts`
7. `src/modules/schedules/schedules.routes.test.ts`

## File to Modify
8. `src/index.ts` - Register schedule router

## Key Decisions
- Factory pattern: `createScheduleRouter(dbOverride?)` accepts optional test DB
- Only COMPANY_ADMIN role for both endpoints
- Tenant isolation via companyId from JWT (no request body companyId)
- PUT performs upsert (create if absent, update if present)
- Validation: at least 1 weekday, time ordering, tolerance >= 0
- Suspended company blocked from PUT
- Response format matches existing: `{ success: true, data: { schedule } }`
