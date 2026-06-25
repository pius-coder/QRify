import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createQrRouter, createPublicQrRouter } from './qr.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

function currentTimeRelativeMinutes(offsetMinutes: number): string {
  const now = new Date()
  const totalMinutes = ((now.getHours() * 60 + now.getMinutes() + offsetMinutes) % 1440 + 1440) % 1440
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

describe('QR Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let scheduleRepo: SqliteScheduleRepository
  let userRepo: SqliteUserRepository
  let adminToken: string
  let employeeToken: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    scheduleRepo = new SqliteScheduleRepository(db)
    userRepo = new SqliteUserRepository(db)

    const company = await companyRepo.create({
      id: 'test-company-id',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'admin-user-id',
      company_id: company.id,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      password_hash: 'hash',
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'employee-user-id',
      company_id: company.id,
      first_name: 'Employee',
      last_name: 'User',
      email: 'employee@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })

    adminToken = await sign(
      { sub: 'admin-user-id', role: 'COMPANY_ADMIN', companyId: company.id, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    employeeToken = await sign(
      { sub: 'employee-user-id', role: 'EMPLOYEE', companyId: company.id, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )
  })

  describe('GET /api/v1/company/qr/status', () => {
    beforeEach(async () => {
      // Set schedule so current time is within arrival window (15 min after start)
      const schedule = await scheduleRepo.upsert('test-company-id', {
        start_time: currentTimeRelativeMinutes(-15),
        break_start_time: null,
        break_end_time: null,
        end_time: currentTimeRelativeMinutes(60),
        late_tolerance_minutes: 10,
      })
      await scheduleRepo.upsertDays(schedule.id, [1, 2, 3, 4, 5, 6, 7])

      app = new Hono()
      app.route('/api/v1/company/qr', createQrRouter(db))
      app.onError((err, c) => {
        if (err instanceof ApiError) {
          return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
        }
        return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500)
      })
    })

    it('returns 200 with active QR', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/qr/status', {
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { activeQr: { eventType: string; token: string } | null } }
      expect(body.success).toBe(true)
      expect(body.data.activeQr).not.toBeNull()
      expect(body.data.activeQr!.eventType).toBe('ARRIVAL')
      expect(body.data.activeQr!.token).toBeTruthy()
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/qr/status'),
      )
      expect(res.status).toBe(401)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/qr/status', {
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/public/companies/:companyCode/active-qr', () => {
    beforeEach(async () => {
      const schedule = await scheduleRepo.upsert('test-company-id', {
        start_time: currentTimeRelativeMinutes(-15),
        break_start_time: null,
        break_end_time: null,
        end_time: currentTimeRelativeMinutes(60),
        late_tolerance_minutes: 10,
      })
      await scheduleRepo.upsertDays(schedule.id, [1, 2, 3, 4, 5, 6, 7])

      app = new Hono()
      app.route('/api/v1/public/companies', createPublicQrRouter(db))
      app.onError((err, c) => {
        if (err instanceof ApiError) {
          return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
        }
        return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500)
      })
    })

    it('returns 200 with active QR for valid company code', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/public/companies/TEST01/active-qr'),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { activeQr: { eventType: string } } }
      expect(body.success).toBe(true)
      expect(body.data.activeQr.eventType).toBe('ARRIVAL')
    })

    it('returns 404 for invalid company code', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/public/companies/INVALID/active-qr'),
      )

      expect(res.status).toBe(404)
    })

    it('returns 403 for suspended company', async () => {
      await companyRepo.update('test-company-id', { status: 'SUSPENDED' })

      const res = await app.fetch(
        new Request('http://localhost/api/v1/public/companies/TEST01/active-qr'),
      )

      expect(res.status).toBe(403)
    })
  })
})
