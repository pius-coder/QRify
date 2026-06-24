# APEX Examine: 04-f03-company-profile-backend

## Status
Complete

---

## Adversarial Review

### Files Reviewed
| File | Lines | Type |
|------|-------|------|
| `src/modules/companies/companies.types.ts` | 25 | NEW - Types |
| `src/modules/companies/companies.errors.ts` | 15 | NEW - Errors |
| `src/modules/companies/companies.schema.ts` | 7 | NEW - Schema |
| `src/modules/companies/companies.service.ts` | 36 | NEW - Service |
| `src/modules/companies/companies.routes.ts` | 40 | NEW - Routes |
| `src/index.ts` | 54 | MODIFIED - Route registration |

### Security Checklist
- [x] No SQL injection — all queries via parameterized repository methods
- [x] No XSS — JSON responses only, no HTML output
- [x] No secrets exposed in responses — no password_hash, no tokens
- [x] Input validation — Zod schema on PUT /company (name: min 1, max 100; timezone: min 1)
- [x] Auth checks — `authMiddleware()` on all three routes
- [x] Role checks — `roleMiddleware('COMPANY_ADMIN')` on all three routes
- [x] Tenant isolation — companyId from JWT, never from request body or URL
- [x] Company code not modifiable — not included in `updateCompanySchema`

### Logic Checklist
- [x] Error handling — all failure modes handled (not found, suspended, validation)
- [x] Edge cases — empty string rejected by Zod, suspended company rejected
- [x] Null/undefined — `companyId!` non-null assertion safe due to role middleware
- [x] No race conditions — synchronous SQLite operations

### Quality Checklist
- [x] Follows module pattern (types, errors, schema, service, routes)
- [x] Factory function pattern (`createCompaniesRouter(dbOverride?)`)
- [x] Consistent error hierarchy (extends ApiError subclasses)
- [x] No code duplication
- [x] Clear naming conventions match existing codebase

### Findings
| ID | Severity | Category | Location | Issue | Validity |
|----|----------|----------|----------|-------|----------|
| F1 | LOW | Quality | `companies.routes.ts:21,29,35` | `companyId!` non-null assertion | Noise — safe because roleMiddleware ensures COMPANY_ADMIN always has companyId |

**Summary:** 0 blocking findings, 1 noise item. Implementation follows all established patterns.

---

## Step Complete
**Status:** ✓ Complete
**Findings:** 1 (noise)
**Next:** step-06-resolve.md (auto-skip since no real findings)
