# Step 01: Analyze

**Task:** F03 company profile frontend
**Started:** 2026-06-25T07:12:49Z

---

## Context Discovery

### Related Files Found

| File | Lines | Contains |
|------|-------|----------|
| `qrify-frontend/src/lib/api/api-client.ts` | 1-30 | Central API client with `apiGet<T>`, `apiPost<T>` |
| `qrify-frontend/src/lib/api/auth.api.ts` | 1-32 | Auth API module pattern: functions wrapping apiGet/apiPost |
| `qrify-frontend/src/lib/stores/auth.store.ts` | 1-114 | Svelte writable/derived store pattern |
| `qrify-frontend/src/lib/types/auth.types.ts` | 1-58 | Type definitions, DTOs, API response types |
| `qrify-frontend/src/lib/utils/api-errors.ts` | 1-21 | `ApiError` class + `extractApiError` helper |
| `qrify-frontend/src/routes/admin/dashboard/+page.svelte` | 1-2 | Placeholder admin dashboard page |
| `qrify-frontend/src/routes/register/company/+page.svelte` | 1-110 | Form pattern with `$state`, `onMount`, error display |
| `qrify-frontend/src/routes/login/+page.svelte` | 1-67 | Login form pattern with role-based redirect |
| `qrify-frontend/src/routes/+layout.svelte` | 1-21 | Root layout with `auth.init()` |
| `qrify-backend/src/modules/companies/companies.routes.ts` | 1-40 | Backend API: `GET /company`, `PUT /company`, `GET /company/code` |
| `qrify-backend/src/modules/companies/companies.service.ts` | 1-36 | Business logic: getProfile, updateProfile, getCompanyCode |
| `qrify-backend/src/modules/companies/companies.types.ts` | 1-32 | `CompanyProfileResponse`, `UpdateCompanyDTO`, `CompanyCodeResponse` |
| `qrify-backend/src/modules/companies/companies.schema.ts` | 1-6 | Zod schema: `updateCompanySchema` (name min 1 max 100, timezone min 1) |

### Patterns Observed

- **API pattern**: `src/lib/api/*.api.ts` with functions wrapping `apiGet`/`apiPost`
- **Store pattern**: Svelte writable/derived with async methods returning promises
- **Type pattern**: `src/lib/types/*.types.ts` with interfaces + DTOs + response types
- **Form pattern**: `$state` for reactive vars, `onMount` for init, `onsubmit` handler, error display with `$auth.error`
- **Navigation**: `goto(resolve('/path'))` with `$app/paths` and `$app/navigation`
- **CSS**: Tailwind utility classes (rounded, border, p-2, bg-blue-600, etc.)
- **Error handling**: `ApiError` class with status, code, message, fields; `extractApiError` for catching

### Backend API Contract

**GET /api/v1/company** (COMPANY_ADMIN only)
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "string",
      "name": "string",
      "companyCode": "string",
      "timezone": "string",
      "status": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

**PUT /api/v1/company** (COMPANY_ADMIN only, not suspended)
```json
// Request
{ "name": "string", "timezone": "string" }
// Response
{
  "success": true,
  "data": {
    "company": { /* same as GET */ }
  }
}
```

**GET /api/v1/company/code** (COMPANY_ADMIN only)
```json
{
  "success": true,
  "data": {
    "companyCode": "string"
  }
}
```

### Frontend Directory Structure

Current state:
```
qrify-frontend/src/
├── lib/
│   ├── api/           → api-client.ts, auth.api.ts
│   ├── stores/        → auth.store.ts
│   ├── types/         → auth.types.ts
│   └── utils/         → api-errors.ts
├── routes/
│   ├── admin/
│   │   └── dashboard/ → placeholder
│   ├── login/         → implemented
│   ├── register/      → company, employee implemented
│   ├── pending/       → implemented
│   ├── employee/      → placeholder
│   └── super-admin/   → placeholder
```

Missing for F03 (per PROJECT.md):
- `src/lib/api/company.api.ts`
- `src/lib/stores/company.store.ts`
- `src/lib/types/company.types.ts`
- `src/routes/admin/company/+page.svelte`

---

## Inferred Acceptance Criteria

Based on "F03 company profile frontend" and PROJECT.md user stories:

- [ ] AC1: Create `company.api.ts` with `getCompany()`, `updateCompany()`, `getCompanyCode()` functions
- [ ] AC2: Create `company.types.ts` with `CompanyProfile`, `UpdateCompanyDTO` interfaces
- [ ] AC3: Create `company.store.ts` with profile loading, update, and error state
- [ ] AC4: Create `/admin/company` page showing company name, code, timezone, status
- [ ] AC5: Display company code with a copy-to-clipboard button
- [ ] AC6: Form to edit company name and timezone with validation
- [ ] AC7: Error handling for suspended company (403)
- [ ] AC8: Success feedback after update
- [ ] AC9: Only visible to COMPANY_ADMIN role (route guard or redirect)

_These will be refined in the planning step._

---

## Summary

**Files analyzed:** 13
**Patterns identified:** 6
**Utilities found:** 3

**Key findings:**
- Backend company API fully implemented (GET/PUT/company, GET/company/code)
- Frontend has established patterns for API clients, stores, types, forms
- Missing: company.api.ts, company.types.ts, company.store.ts, admin/company page
- Company code is read-only in MVP (no regenerate endpoint)

→ Proceeding to planning phase...
