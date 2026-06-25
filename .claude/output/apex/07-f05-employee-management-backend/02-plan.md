# Step 02: Plan

**Task:** F05 employee management backend
**Started:** 2026-06-25T08:29:31Z

---

## Planning Progress

*Plan approved by user.*

---

## Implementation Plan: F05 Employee Management Backend

### Overview
Create a new `employees` module with 4 REST endpoints (list, get, update, update-status) for COMPANY_ADMIN to manage employees, plus add a generic `update` method to the UserRepository.

### File Changes

#### `src/database/repositories/contracts/user.repository.ts` (MODIFY)
- Add `update` method signature: `update(id: string, data: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>): Promise<UserData | null>`

#### `src/database/repositories/sqlite/sqlite-user.repository.ts` (MODIFY)
- Implement `update` using COALESCE pattern (follow `sqlite-company.repository.ts:31-38`)

#### `src/database/repositories/sqlite/sqlite-user.repository.test.ts` (MODIFY)
- Add `describe('update', ...)` block with tests for: updating name/email, partial update, non-existent ID

#### `src/modules/employees/employees.types.ts` (NEW)
- `EmployeeResponse`: `id, companyId, firstName, lastName, email, role, status, createdAt, updatedAt`
- `UpdateEmployeeDTO`: `firstName?, lastName?, email?`
- `UpdateEmployeeStatusDTO`: `status` (string)
- `toEmployeeResponse(user: UserData): EmployeeResponse` converter

#### `src/modules/employees/employees.errors.ts` (NEW)
- `EmployeeNotFoundError` → NotFoundError (404)
- `EmployeeNotInCompanyError` → BadRequestError (400)
- `InvalidStatusTransitionError` → BadRequestError (400)
- `CannotModifyCompanyAdminError` → ForbiddenError (403)

#### `src/modules/employees/employees.schema.ts` (NEW)
- `updateEmployeeSchema`: `firstName` (optional, 1-50), `lastName` (optional, 1-50), `email` (optional, email). At least one field required via `.refine()`
- `updateEmployeeStatusSchema`: `status` with `.refine()` validating allowed transitions

#### `src/modules/employees/employees.service.ts` (NEW)
- Class `EmployeeService` with `UserRepository` dependency
- `list(companyId)`: calls `findAllByCompany`, filters EMPLOYEE role, maps to response
- `getById(companyId, employeeId)`: calls `findById`, verifies company membership + EMPLOYEE role
- `update(companyId, employeeId, dto)`: verification + `userRepo.update`
- `updateStatus(companyId, employeeId, dto)`: validates transition + `userRepo.updateStatus`

#### `src/modules/employees/employees.routes.ts` (NEW)
- Factory `createEmployeesRouter(dbOverride?)`
- `GET /` → auth + roleMiddleware('COMPANY_ADMIN') → list
- `GET /:id` → auth + roleMiddleware('COMPANY_ADMIN') → getById
- `PUT /:id` → auth + roleMiddleware('COMPANY_ADMIN') → update
- `PATCH /:id/status` → auth + roleMiddleware('COMPANY_ADMIN') → updateStatus

#### `src/index.ts` (MODIFY)
- Add import + route registration for employees

### Testing Strategy
#### `src/modules/employees/employees.service.test.ts` (NEW)
- `list`: returns only EMPLOYEE role users, empty array for none
- `getById`: returns employee, throws on non-existent/wrong company
- `update`: updates fields, throws on non-existent/wrong company
- `updateStatus`: valid transitions succeed, invalid throws

#### `src/modules/employees/employees.routes.test.ts` (NEW)
- All 4 endpoints: 200 success, 401 no auth, 403 wrong role, 422 invalid body
- 404 for non-existent employee

### File Summary
- **Modified:** 3 files (user contract, SQLite repo, index.ts)
- **New:** 7 files (4 module files + 2 tests + schema)
- **Tests:** 2 test files
