# Resolution: F04 Work Schedule Backend

## Findings Resolved

### F1: Weekday uniqueness — RESOLVED
Added `.refine((arr) => new Set(arr).size === arr.length, 'Weekdays must be unique')` to the weekdays field in `schedules.schema.ts`. Now returns a clean validation error instead of a raw SQLite constraint error.

### F2: `toMinutes` duplication — RESOLVED
Extracted `toMinutes` to a module-level helper function in `schedules.schema.ts`. Both refine blocks now reference the shared function.

### F3: `WEEKDAY_NAMES` unused — NO ACTION
Exported for future frontend consumers. Not a bug.

## Verification
- `bun run typecheck` — passes
- `bun test src/modules/schedules/schedules.service.test.ts` — 7/7 pass
