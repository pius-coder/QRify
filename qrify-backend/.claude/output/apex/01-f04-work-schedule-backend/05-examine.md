# Adversarial Review: F04 Work Schedule Backend

## Findings

### F1: Weekday uniqueness not enforced at schema level (Medium)
**File:** `src/modules/schedules/schedules.schema.ts:16-18`
**Issue:** The weekdays array allows duplicates (e.g., `[1, 1, 2, 3]`). While the database has a UNIQUE constraint on `(schedule_id, weekday)`, the error would be a raw SQLite constraint error rather than a clean validation message.
**Fix:** Add `.refine((arr) => new Set(arr).size === arr.length, 'Weekdays must be unique')` to the weekdays field.

### F2: `toMinutes` helper duplicated (Low)
**File:** `src/modules/schedules/schedules.schema.ts:22-27, 38-43`
**Issue:** The `toMinutes` function is defined identically in both `.refine()` blocks.
**Fix:** Extract to a module-level helper.

### F3: `WEEKDAY_NAMES` exported but unused (Low)
**File:** `src/modules/schedules/schedules.types.ts:3-11`
**Issue:** The constant is exported but not used in any response or service code.
**Fix:** Keep for future use by frontend consumers, but note it's unused.

## Non-Findings (Verified Correct)
- Tenant isolation: companyId comes from JWT, not request body
- Role guard: COMPANY_ADMIN only for both endpoints
- Suspended company check before upsert
- Time ordering validated via Zod refinements
- Break times must be both present or both null
- At least one weekday required
- Repository contract properly used (no direct SQL in service)
- Factory pattern with dbOverride for testability
- `import type` used for type-only imports (verbatimModuleSyntax)
- All status/role values UPPERCASE
- No `any` types used
