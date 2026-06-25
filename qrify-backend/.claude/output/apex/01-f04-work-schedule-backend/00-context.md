# APEX Task: 01-f04-work-schedule-backend

**Created:** 2026-06-25
**Task:** F04 work schedule backend

## Flags
- Auto mode: true
- Examine mode: true
- Save mode: true
- Test mode: true

## User Request
F04 work schedule backend: GET /company/schedule, PUT /company/schedule endpoints. Schedule repository contract exists. Create schedules module (routes, service, schema, types, errors). Work schedule CRUD with weekday management. Time validation (start < break_start < break_end < end). At least one working day required. Company admin only. Tenant isolation via companyId from JWT.

## Acceptance Criteria
- [ ] GET /api/v1/company/schedule returns current schedule with days
- [ ] PUT /api/v1/company/schedule creates or updates schedule
- [ ] Working days validated (at least 1 day)
- [ ] Time ordering validated (start < break_start < break_end < end)
- [ ] Late tolerance >= 0
- [ ] Company admin only access
- [ ] Tenant isolation (schedule belongs to authenticated company)
- [ ] Suspended company cannot modify schedule
- [ ] Schedule response includes weekday list
- [ ] Zod schema validation on PUT
