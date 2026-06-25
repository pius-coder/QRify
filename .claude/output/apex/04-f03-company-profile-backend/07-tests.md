# APEX Tests: 04-f03-company-profile-backend

## Status
Complete

---

## Test Plan

**Framework:** bun:test (describe/it/expect/beforeEach)
**Command:** `JWT_SECRET=... bun test`

### Tests Created

**Service Tests:** `src/modules/companies/companies.service.test.ts` (7 tests)
- getProfile > returns company profile for valid companyId
- getProfile > throws for non-existent companyId
- updateProfile > updates name and timezone
- updateProfile > throws for suspended company
- updateProfile > throws for non-existent companyId
- getCompanyCode > returns company code for valid companyId
- getCompanyCode > throws for non-existent companyId

**Integration Tests:** `src/modules/companies/companies.routes.test.ts` (9 tests)
- GET /api/v1/company > returns 200 with company profile
- GET /api/v1/company > returns 401 without auth cookie
- GET /api/v1/company > returns 403 for EMPLOYEE role
- PUT /api/v1/company > returns 200 with updated company
- PUT /api/v1/company > returns 422 with invalid body
- PUT /api/v1/company > returns 403 for EMPLOYEE role
- GET /api/v1/company/code > returns 200 with company code
- GET /api/v1/company/code > returns 403 for EMPLOYEE role
- GET /api/v1/company/code > returns 401 without auth cookie

### Test Results
- 66/66 passing (50 existing + 16 new)
- 0 failures

---

## Step Complete
**Status:** ✓ Complete
**Tests created:** 16 (2 files)
**Next:** step-08-run-tests.md
