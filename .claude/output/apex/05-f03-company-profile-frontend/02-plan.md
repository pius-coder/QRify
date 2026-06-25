# Step 02: Plan

**Task:** F03 company profile frontend
**Started:** 2026-06-25T07:12:49Z

---

## Implementation Plan: F03 Company Profile Frontend

### Overview

Implement the company profile page at `/admin/company` with view/edit company info, company code display with copy button, and proper error handling. Follow existing patterns from auth.api.ts, auth.store.ts, and register/company page.

### Prerequisites

- [x] Backend API endpoints exist: `GET /company`, `PUT /company`, `GET /company/code`
- [x] Frontend has established patterns (api-client, store, form handling)

---

### File Changes

#### `qrify-frontend/src/lib/api/api-client.ts` (MODIFY)
- Add `apiPut<T>(path, body?)` function following existing `apiPost` pattern
- Needed because backend uses PUT for company update (not POST)

#### `qrify-frontend/src/lib/types/company.types.ts` (NEW FILE)
- Define `CompanyProfile` interface matching backend `CompanyProfileResponse`:
  - `id: string`, `name: string`, `companyCode: string`, `timezone: string`
  - `status: string`, `createdAt: string`, `updatedAt: string`
- Define `UpdateCompanyDTO` with `name: string`, `timezone: string`
- Follow naming conventions from `auth.types.ts`

#### `qrify-frontend/src/lib/api/company.api.ts` (NEW FILE)
- Create `getCompany()` → wraps `apiGet('/company')` → returns `{ company: CompanyProfile }`
- Create `updateCompany(dto)` → wraps `apiPut('/company', dto)` → returns `{ company: CompanyProfile }`
- Create `getCompanyCode()` → wraps `apiGet('/company/code')` → returns `{ companyCode: string }`
- Follow pattern from `auth.api.ts`

#### `qrify-frontend/src/lib/stores/company.store.ts` (NEW FILE)
- Create writable store with:
  - `profile: CompanyProfile | null`
  - `isLoading: boolean`
  - `error: string | Record<string, string> | null`
  - `isSuccess: boolean`
- Methods:
  - `load()` – calls `getCompany()`, sets profile or error
  - `update(dto)` – calls `updateCompany(dto)`, updates profile, sets success, handles error (especially SUSPENDED company 403)
  - `loadCode()` – calls `getCompanyCode()`, fills code display
  - `clearError()` / `clearSuccess()`
- Follow pattern from `auth.store.ts`

#### `qrify-frontend/src/routes/admin/company/+page.svelte` (NEW FILE)
- Page layout:
  - **Company Info Card**: name, companyCode (with copy button), timezone, status
  - **Edit Form**: editable name and timezone, submit button
  - **Company Code Section**: code display + copy-to-clipboard button
- Behavior:
  - `onMount()` → load company profile (and code separately)
  - View mode by default, toggle to edit mode
  - Copy button uses `navigator.clipboard.writeText()`
  - Status badge: ACTIVE=green, SUSPENDED=red
  - Success feedback: green toast after update
  - Error handling: display API errors, especially for suspended company
- Follow form pattern from `register/company/+page.svelte` and style from `login/+page.svelte`

---

### Testing Strategy

**New tests:**
- `qrify-frontend/tests/unit/company.api.test.ts` – Test API functions with mocked fetch
- Test store methods with mock API responses
- Test page rendering with mock data

**Manual verification:**
- Navigate to `/admin/company` while logged in as COMPANY_ADMIN
- Verify company info loads
- Edit name and timezone, verify update
- Click copy code button, verify clipboard
- Verify redirect when not COMPANY_ADMIN

---

### Acceptance Criteria Mapping
- [ ] AC1: `company.api.ts` created with `getCompany()`, `updateCompany()`, `getCompanyCode()`
- [ ] AC2: `company.types.ts` created with `CompanyProfile`, `UpdateCompanyDTO`
- [ ] AC3: `company.store.ts` created with profile loading, update, and error state
- [ ] AC4: `/admin/company` page shows company name, code, timezone, status
- [ ] AC5: Company code displayed with copy-to-clipboard button
- [ ] AC6: Form to edit company name and timezone with validation
- [ ] AC7: Error handling for suspended company (API returns error, displayed to user)
- [ ] AC8: Success feedback after update
- [ ] AC9: Only visible to COMPANY_ADMIN (route relies on backend auth, unauthorized will get 401/403)

---

### Risks & Considerations
- **Route guard**: The page relies on backend auth middleware. If not authenticated as COMPANY_ADMIN, the API calls will fail with 401/403. No explicit frontend guard needed per existing patterns.
- **api-client update**: Adding `apiPut` is minimal but needed; no other frontend code depends on it yet.
- **Company code endpoint**: Separate from profile GET – may want to inline it into the profile response but the backend already returns it in the profile.

---

## Step Complete
**Status:** ✓ Complete
**Files planned:** 5 (3 new, 1 modified in existing, 1 new page)
**Tests planned:** 0 (manual verification in MVP)
**Next:** step-03-execute.md
**Timestamp:** 2026-06-25T07:12:49Z
