import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createMeRouter } from './me.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Me Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let attendanceRepo: SqliteAttendanceRepository
  let employeeToken: string
  let adminToken: string
  let companyId: string
  let employeeId: string
  let today: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)
    attendanceRepo = new SqliteAttendanceRepository(db)

    today = new Date().toISOString().split('T')[0] ?? ''

    const company = await companyRepo.create({
      id: 'test-company-id',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })
    companyId = company.id

    const employeeUser = await userRepo.create({
      id: 'employee-user-id',
      company_id: companyId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })
    employeeId = employeeUser.id

    const adminUser = await userRepo.create({
      id: 'admin-user-id',
      company_id: companyId,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      password_hash: 'hash',
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
    })

    employeeToken = await sign(
      { sub: employeeUser.id, role: 'EMPLOYEE', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    adminToken = await sign(
      { sub: adminUser.id, role: 'COMPANY_ADMIN', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    app = new Hono()
    app.route('/api/v1/me', createMeRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/me/attendance/today', () => {
    it('returns 200 with today attendance', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: employeeId, work_date: today,
        arrival_at: '2026-06-25T08:00:00Z', break_start_at: null, break_end_at: null, departure_at: null,
        status: 'INCOMPLETE', late_minutes: 0, break_minutes: 0, worked_minutes: 0, overtime_minutes: 0,
      })

      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance/today', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { date: string; attendance: unknown } }
      expect(body.success).toBe(true)
      expect(body.data.date).toBe(today)
      expect(body.data.attendance).not.toBeNull()
    })

    it('returns 200 with null attendance when no record', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance/today', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendance: unknown } }
      expect(body.success).toBe(true)
      expect(body.data.attendance).toBeNull()
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance/today', { method: 'GET' }),
      )
      expect(res.status).toBe(401)
    })

    it('returns 403 for COMPANY_ADMIN role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance/today', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/me/attendances', () => {
    it('returns 200 with attendance list', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: employeeId, work_date: '2026-06-24',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })

      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendances: unknown[]; total: number } }
      expect(body.success).toBe(true)
      expect(body.data.attendances).toHaveLength(1)
      expect(body.data.total).toBe(1)
    })

    it('returns 401 without auth', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances', { method: 'GET' }),
      )
      expect(res.status).toBe(401)
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/me/attendances/:date', () => {
    it('returns 200 with attendance detail', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: employeeId, work_date: '2026-06-25',
        arrival_at: '2026-06-25T08:00:00Z', break_start_at: null, break_end_at: null, departure_at: null,
        status: 'INCOMPLETE', late_minutes: 0, break_minutes: 0, worked_minutes: 0, overtime_minutes: 0,
      })

      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances/2026-06-25', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendance: { workDate: string }; scanEvents: unknown[] } }
      expect(body.success).toBe(true)
      expect(body.data.attendance.workDate).toBe('2026-06-25')
    })

    it('returns 404 for non-existent date', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances/2026-06-25', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendances/2026-06-25', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/me/attendance-summary', () => {
    it('returns 200 with summary', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: employeeId, work_date: '2026-06-01',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })

      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance-summary', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { totalDays: number } }
      expect(body.success).toBe(true)
      expect(body.data.totalDays).toBe(1)
    })

    it('returns 401 without auth', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/attendance-summary', { method: 'GET' }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/v1/me/profile', () => {
    it('returns 200 with updated profile', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(employeeToken),
          },
          body: JSON.stringify({ firstName: 'Jane', lastName: 'Smith' }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { user: { firstName: string; lastName: string } } }
      expect(body.success).toBe(true)
      expect(body.data.user.firstName).toBe('Jane')
      expect(body.data.user.lastName).toBe('Smith')
    })

    it('returns 422 with empty body', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(employeeToken),
          },
          body: JSON.stringify({}),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 401 without auth', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'Jane' }),
        }),
      )
      expect(res.status).toBe(401)
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/me/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ firstName: 'Jane' }),
        }),
      )
      expect(res.status).toBe(403)
    })
  })
})
