# Validation: F04 Work Schedule Backend

## Typecheck
✅ `bun run typecheck` — passes with no errors

## Service Tests (7/7 pass)
✅ SchedulesService > getSchedule > returns schedule for company with schedule
✅ SchedulesService > getSchedule > throws for company without schedule
✅ SchedulesService > getSchedule > throws for non-existent company
✅ SchedulesService > upsertSchedule > creates schedule when none exists
✅ SchedulesService > upsertSchedule > updates existing schedule
✅ SchedulesService > upsertSchedule > throws for suspended company
✅ SchedulesService > upsertSchedule > throws for non-existent company

## Route Tests (pre-existing failure)
⚠️ Schedule route tests return 401 for authenticated requests
⚠️ Companies route tests (pre-existing, on clean main) also return 401
⚠️ Root cause: JWT verification fails in bun test runner for all authenticated route tests
⚠️ Not introduced by this feature — verified by stashing changes and re-testing

## Files Created
- `src/modules/schedules/schedules.types.ts`
- `src/modules/schedules/schedules.schema.ts`
- `src/modules/schedules/schedules.errors.ts`
- `src/modules/schedules/schedules.service.ts`
- `src/modules/schedules/schedules.routes.ts`
- `src/modules/schedules/schedules.service.test.ts`
- `src/modules/schedules/schedules.routes.test.ts`

## Files Modified
- `src/index.ts` — registered schedule router at `/api/v1/company/schedule`
