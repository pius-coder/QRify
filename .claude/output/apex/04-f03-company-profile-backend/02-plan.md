# APEX Plan: 04-f03-company-profile-backend

## Status
Complete

---

## Implementation Plan: F03 Company Profile Backend

### Overview
Create company profile module with three endpoints (`GET /company`, `PUT /company`, `GET /company/code`) following the established auth module pattern. The authenticated user's JWT `companyId` is used for tenant isolation — company routes never accept `companyId` from request body.

### Prerequisites
- [x] F02 auth backend merged (provides auth middleware, role middleware, services, types)

---

### File Changes

#### `src/modules/companies/companies.types.ts` (NEW)
- Define `CompanyProfileResponse` interface (camelCase API shape)
- Define `UpdateCompanyDTO` interface (name, timezone)
- Define `CompanyCodeResponse` interface

#### `src/modules/companies/companies.errors.ts` (NEW)
- `CompanySuspendedError extends ForbiddenError` — thrown when modifying a suspended company

#### `src/modules/companies/companies.schema.ts` (NEW)
- `updateCompanySchema` — Zod object with:
  - `name: z.string().min(1).max(100)`
  - `timezone: z.string().min(1)` (validated by existence check in service)

#### `src/modules/companies/companies.service.ts` (NEW)
- `CompaniesService` class with constructor injection:
  - `private companyRepo: CompanyRepository`
- Methods:
  - `getProfile(companyId: string): Promise<CompanyProfileResponse>` — fetches company by ID, returns camelCase profile
  - `updateProfile(companyId: string, dto: UpdateCompanyDTO): Promise<CompanyProfileResponse>` — checks if suspended, updates name/timezone via repo, returns updated profile
  - `getCompanyCode(companyId: string): Promise<CompanyCodeResponse>` — fetches company, returns `{ companyCode }`
- Private mapper: `toCompanyProfileResponse(company: CompanyData): CompanyProfileResponse`

#### `src/modules/companies/companies.routes.ts` (NEW)
- `createCompaniesRouter(dbOverride?)` factory function
- Wire dependencies: `db = dbOverride ?? getDatabase()`, `companyRepo = new SqliteCompanyRepository(db)`, `companiesService = new CompaniesService(companyRepo)`
- Routes (all protected with authMiddleware + roleMiddleware):
  - `GET /` → `companiesService.getProfile(user.companyId)` → returns `{ success: true, data: { company } }`
  - `PUT /` → validate body with `updateCompanySchema`, call `companiesService.updateProfile(user.companyId, dto)` → returns `{ success: true, data: { company } }`
  - `GET /code` → `companiesService.getCompanyCode(user.companyId)` → returns `{ success: true, data: { companyCode } }`

#### `src/index.ts` (UPDATE)
- Add import: `import { createCompaniesRouter } from './modules/companies/companies.routes'`
- Add route: `app.route('/api/v1/company', createCompaniesRouter())` (after auth routes)

---

### Testing Strategy

#### `src/modules/companies/companies.service.test.ts` (NEW)
- `getProfile` happy path — returns company profile for valid companyId
- `getProfile` with invalid companyId — throws `NotFoundError`
- `updateProfile` happy path — updates name and timezone
- `updateProfile` for suspended company — throws `CompanySuspendedError`
- `getCompanyCode` happy path — returns company code

#### `src/modules/companies/companies.routes.test.ts` (NEW)
- Uses `createTestDb()` + `createCompaniesRouter(testDb)` pattern
- Before each: seed a test company + COMPANY_ADMIN user
- `GET /` — returns 200 with company profile
- `GET /` — returns 401 without auth cookie
- `GET /` — returns 403 for EMPLOYEE role
- `PUT /` — returns 200 with updated company
- `PUT /` — returns 422 with invalid body
- `PUT /` — returns 403 for suspended company
- `GET /code` — returns 200 with company code
- `GET /code` — returns 403 for EMPLOYEE role

---

### Acceptance Criteria Mapping
- [x] AC1: `GET /api/v1/company` returns profile → `companies.routes.ts` GET handler
- [x] AC2: Tenant isolation via JWT → `companies.service.ts` uses `companyId` from JWT only
- [x] AC3: `PUT /api/v1/company` updates name/timezone → `companies.service.ts` updateProfile
- [x] AC4: company_code not modifiable → update schema doesn't include company_code
- [x] AC5: Suspended company rejects PUT → `companies.service.ts` checks status
- [x] AC6: `GET /api/v1/company/code` returns code → `companies.routes.ts` GET /code handler
- [x] AC7: Employee role rejected → `roleMiddleware('COMPANY_ADMIN')` on all routes
- [x] AC8: companyId from JWT only → service uses `user.companyId`, never from body

---

### Risks & Considerations
- Company must exist for the authenticated user (guaranteed by auth flow — JWT issued with valid companyId for COMPANY_ADMIN)
- Timezone validation: basic string validation, advanced timezone validation could be added later
- The `CompanyRepository.update()` already handles partial updates via `COALESCE`

---

## Step Complete
**Status:** ✓ Complete
**Files to create:** 5 (types, errors, schema, service, routes)
**Files to update:** 1 (index.ts)
**Test files:** 2 (service.test, routes.test)
**Next:** step-03-execute.md
