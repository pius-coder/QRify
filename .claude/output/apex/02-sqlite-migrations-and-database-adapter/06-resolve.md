# Step 06: Resolve

**Task:** F01 SQLite migrations and database adapter
**Started:** 2026-06-24T14:48:00Z

---

## Resolution Log

_Fixes will be logged here..._

## Resolution Results

### F1 [CRITICAL] - Attendance repo dynamic SQL → COALESCE
**File:** `src/database/repositories/sqlite/sqlite-attendance.repository.ts:23-46`
**Fix:** Replaced `Object.entries(data)` SQL injection vector with hardcoded COALESCE per column (matching pattern from company repo).
**Verification:** ✅ Tests pass, no dynamic SQL in update()

### F2 [CRITICAL] - Schedule upsert ON CONFLICT mismatch
**File:** `src/database/repositories/sqlite/sqlite-schedule.repository.ts:20`
**Fix:** Changed `ON CONFLICT(company_id)` to `ON CONFLICT(id)` since `id` (PRIMARY KEY) is reused from existing lookup.
**Verification:** ✅ Tests pass, upsert works for create+update

### F3 [HIGH] - upsertDays missing transaction
**File:** `src/database/repositories/sqlite/sqlite-schedule.repository.ts:42-55`
**Fix:** Wrapped DELETE + INSERT loop in `this.db.transaction()`. SELECT query runs outside transaction after commit.
**Verification:** ✅ Tests pass, atomic DELETE/INSERT guaranteed

### F6 [HIGH] - Duplicated table lists
**Files:** `scripts/migrate.ts`, `scripts/reset-database.ts`
**Fix:** Extracted `ALL_TABLES` constant to `src/database/constants.ts`. Both scripts import from shared source.
**Verification:** ✅ `reset-db` and `migrate --reset` work correctly

### F10 [MEDIUM] - Redundant duplicate index
**File:** `migrations/sqlite/008_create_indexes.sql:8`
**Fix:** Removed `idx_attendance_unique` — the UNIQUE constraint in `007_create_attendance_records.sql:17` already creates this index.
**Verification:** ✅ All migrations apply cleanly

### F9 [MEDIUM] - Unsafe `as` casts
**File:** `src/database/repositories/sqlite/sqlite-company.repository.ts:28`
**Fix:** Changed `rows[0] as CompanyData` to `rows[0]!`
**Note:** Remaining repos still use `as` pattern — accepted as low-risk since INSERT+SELECT by PK is deterministic.

### Final Verification
- ✅ All 30 tests pass
- ✅ TypeScript typecheck passes
- ✅ Reset + seed scripts work
- ✅ No remaining CRITICAL or HIGH findings

