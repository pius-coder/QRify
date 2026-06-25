import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createScheduleRouter } from './schedules.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Schedule Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let scheduleRepo: SqliteScheduleRepository
  let adminToken: string
  let employeeToken: string
  let companyId: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)
    scheduleRepo = new SqliteScheduleRepository(db)

    const company = await companyRepo.create({
      id: 'test-company-id',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })
    companyId = company.id

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

    const employeeUser = await userRepo.create({
      id: 'employee-user-id',
      company_id: companyId,
      first_name: 'Employee',
      last_name: 'User',
      email: 'employee@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })

    adminToken = await sign(
      { sub: adminUser.id, role: 'COMPANY_ADMIN', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    employeeToken = await sign(
      { sub: employeeUser.id, role: 'EMPLOYEE', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    app = new Hono()
    app.route('/api/v1/company/schedule', createScheduleRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/company/schedule', () => {
    it('returns 404 when no schedule exists', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 200 with schedule when it exists', async () => {
      const schedule = await scheduleRepo.upsert(companyId, {
        start_time: '09:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '18:00',
        late_tolerance_minutes: 10,
      })
      await scheduleRepo.upsertDays(schedule.id, [1, 2, 3, 4, 5])

      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { schedule: { startTime: string; weekdays: number[] } } }
      expect(body.success).toBe(true)
      expect(body.data.schedule.startTime).toBe('09:00')
      expect(body.data.schedule.weekdays).toEqual([1, 2, 3, 4, 5])
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', { method: 'GET' }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/v1/company/schedule', () => {
    it('returns 200 with created schedule', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            startTime: '09:00',
            breakStartTime: '12:00',
            breakEndTime: '13:00',
            endTime: '18:00',
            lateToleranceMinutes: 10,
            weekdays: [1, 2, 3, 4, 5],
          }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { schedule: { startTime: string; weekdays: number[] } } }
      expect(body.success).toBe(true)
      expect(body.data.schedule.startTime).toBe('09:00')
      expect(body.data.schedule.weekdays).toEqual([1, 2, 3, 4, 5])
    })

    it('returns 200 with updated schedule', async () => {
      await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            startTime: '09:00',
            breakStartTime: null,
            breakEndTime: null,
            endTime: '17:00',
            lateToleranceMinutes: 5,
            weekdays: [1, 2, 3, 4, 5],
          }),
        }),
      )

      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            startTime: '08:00',
            breakStartTime: '12:00',
            breakEndTime: '13:00',
            endTime: '18:00',
            lateToleranceMinutes: 15,
            weekdays: [1, 2, 3, 4, 5, 6],
          }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { schedule: { startTime: string; weekdays: number[] } } }
      expect(body.data.schedule.startTime).toBe('08:00')
      expect(body.data.schedule.weekdays).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('returns 422 with invalid body', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ startTime: '' }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 422 when no weekdays', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            startTime: '09:00',
            breakStartTime: null,
            breakEndTime: null,
            endTime: '18:00',
            lateToleranceMinutes: 0,
            weekdays: [],
          }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 422 when start time after end time', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            startTime: '18:00',
            breakStartTime: null,
            breakEndTime: null,
            endTime: '09:00',
            lateToleranceMinutes: 0,
            weekdays: [1, 2, 3, 4, 5],
          }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(employeeToken),
          },
          body: JSON.stringify({
            startTime: '09:00',
            breakStartTime: null,
            breakEndTime: null,
            endTime: '18:00',
            lateToleranceMinutes: 0,
            weekdays: [1, 2, 3, 4, 5],
          }),
        }),
      )

      expect(res.status).toBe(403)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/schedule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: '09:00',
            breakStartTime: null,
            breakEndTime: null,
            endTime: '18:00',
            lateToleranceMinutes: 0,
            weekdays: [1, 2, 3, 4, 5],
          }),
        }),
      )

      expect(res.status).toBe(401)
    })
  })
})
