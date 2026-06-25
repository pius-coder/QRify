# APEX Task: 04-f03-company-profile-backend

**Created:** 2026-06-24T20:04:21Z
**Task:** F03 company profile backend

---

## Configuration

| Flag | Value |
|------|-------|
| Auto mode (`-a`) | true |
| Examine mode (`-x`) | true |
| Save mode (`-s`) | true |
| Test mode (`-t`) | true |
| Economy mode (`-e`) | false |
| Branch mode (`-b`) | true |
| PR mode (`-pr`) | false |
| Interactive mode (`-i`) | false |
| Branch name | feat/F03-company-profile-backend |

---

## User Request

```
-a -x -b -s -t F03 company profile backend
```

---

## Acceptance Criteria

- [x] AC1: `GET /api/v1/company` returns company profile for authenticated COMPANY_ADMIN
- [x] AC2: `GET /api/v1/company` rejects COMPANY_ADMIN from other companies (tenant isolation via JWT companyId)
- [x] AC3: `PUT /api/v1/company` updates name and timezone
- [x] AC4: `PUT /api/v1/company` rejects modification of company_code
- [x] AC5: `PUT /api/v1/company` rejects requests when company is SUSPENDED
- [x] AC6: `GET /api/v1/company/code` returns company_code for authenticated COMPANY_ADMIN
- [x] AC7: `GET /api/v1/company/code` rejects non-COMPANY_ADMIN roles
- [x] AC8: All endpoints respect tenant isolation (use companyId from JWT, never from request)

---

## Progress

| Step | Status | Timestamp |
|------|--------|-----------|
| 00-init | ✓ Complete | 2026-06-24T20:04:53Z |
| 01-analyze | ✓ Complete | 2026-06-24T20:09:16Z |
| 02-plan | ✓ Complete | 2026-06-24T20:10:51Z |
| 03-execute | ✓ Complete | 2026-06-24T20:18:50Z |
| 04-validate | ✓ Complete | 2026-06-24T20:14:17Z |
| 05-examine | ✓ Complete | 2026-06-24T20:18:10Z |
| 06-resolve | ✓ Complete | 2026-06-24T20:18:23Z |
| 07-tests | ✓ Complete | 2026-06-24T20:17:00Z |
| 08-run-tests | ✓ Complete | 2026-06-24T20:17:00Z |
| 09-finish | ⏭ Skip | |
