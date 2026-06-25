import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { createTestDb } from '../../database/test-utils'
import type { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createAttendancesRouter } from './attendances.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Attendances Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let attendanceRepo: SqliteAttendanceRepository
  let adminToken: string
  let employeeToken: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)
    attendanceRepo = new SqliteAttendanceRepository(db)

    await companyRepo.create({
      id: 'test-company-id',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'admin-user-id',
      company_id: 'test-company-id',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      password_hash: 'hash',
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'employee-user-id',
      company_id: 'test-company-id',
      first_name: 'Alice',
      last_name: 'Martin',
      email: 'alice@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })

    await attendanceRepo.create({
      company_id: 'test-company-id',
      user_id: 'employee-user-id',
      work_date: '2026-06-25',
      arrival_at: '2026-06-25T09:00:00.000Z',
      break_start_at: null,
      break_end_at: null,
      departure_at: null,
      status: 'PRESENT',
      late_minutes: 0,
      break_minutes: 0,
      worked_minutes: 0,
      overtime_minutes: 0,
    })

    adminToken = await sign(
      { sub: 'admin-user-id', role: 'COMPANY_ADMIN', companyId: 'test-company-id', status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    employeeToken = await sign(
      { sub: 'employee-user-id', role: 'EMPLOYEE', companyId: 'test-company-id', status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    app = new Hono()
    app.route('/api/v1/attendances', createAttendancesRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500)
    })
  })

  describe('GET /api/v1/attendances', () => {
    it('returns 200 with attendance list for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/attendances?date=2026-06-25', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendances: unknown[]; pagination: { total: number } } }
      expect(body.success).toBe(true)
      expect(body.data.attendances).toHaveLength(1)
      expect(body.data.pagination.total).toBe(1)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/attendances?date=2026-06-25', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )
      expect(res.status).toBe(403)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/attendances?date=2026-06-25', {
          method: 'GET',
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/attendances/:id', () => {
    it('returns 200 with attendance detail for COMPANY_ADMIN', async () => {
      const records = await attendanceRepo.findByCompanyAndDate('test-company-id', '2026-06-25')
      const recordId = records[0]!.id

      const res = await app.fetch(
        new Request(`http://localhost/api/v1/attendances/${recordId}`, {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendance: { id: string; events: unknown[] } } }
      expect(body.success).toBe(true)
      expect(body.data.attendance.id).toBe(recordId)
    })

    it('returns 404 for nonexistent attendance', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/attendances/nonexistent-id', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )
      expect(res.status).toBe(404)
    })
  })
})
