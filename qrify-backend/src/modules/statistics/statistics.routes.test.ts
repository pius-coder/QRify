import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createStatisticsRouter } from './statistics.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Statistics Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let companyAdminToken: string
  let employeeToken: string
  let companyId: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)

    await companyRepo.create({
      id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE',
    })
    companyId = 'comp-1'

    const adminUser = await userRepo.create({
      id: 'admin-id', company_id: companyId, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', password_hash: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE',
    })

    const empUser = await userRepo.create({
      id: 'emp-id', company_id: companyId, first_name: 'Emp', last_name: 'Loyee', email: 'emp@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
    })

    companyAdminToken = await sign(
      { sub: adminUser.id, role: 'COMPANY_ADMIN', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET, 'HS256',
    )

    employeeToken = await sign(
      { sub: empUser.id, role: 'EMPLOYEE', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET, 'HS256',
    )

    app = new Hono()
    app.route('/api/v1/company/statistics', createStatisticsRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/company/statistics/dashboard', () => {
    it('returns 200 with dashboard data', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/dashboard', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { activeEmployees: number; activeQr: boolean } }
      expect(body.success).toBe(true)
      expect(body.data.activeEmployees).toBe(1)
      expect(body.data.activeQr).toBe(false)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/dashboard', {
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )
      expect(res.status).toBe(403)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/dashboard'),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/company/statistics/attendance', () => {
    it('returns 200 with attendance stats', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/attendance?startDate=2025-01-01&endDate=2025-01-31', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { attendanceRate: number; dailyChart: unknown[] } }
      expect(body.success).toBe(true)
      expect(body.data.attendanceRate).toBe(0)
      expect(body.data.dailyChart).toHaveLength(0)
    })

    it('returns 422 for missing date params', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/attendance', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 422 for invalid date format', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/attendance?startDate=01-01-2025&endDate=31-01-2025', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/attendance?startDate=2025-01-01&endDate=2025-01-31', {
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/company/statistics/rankings', () => {
    it('returns 200 with assiduity rankings', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/rankings?type=assiduity&startDate=2025-01-01&endDate=2025-01-31', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { type: string; rankings: unknown[] } }
      expect(body.success).toBe(true)
      expect(body.data.type).toBe('assiduity')
    })

    it('returns 422 for invalid ranking type', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/rankings?type=invalid&startDate=2025-01-01&endDate=2025-01-31', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 422 for missing params', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/rankings', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/v1/company/statistics/reports/weekly', () => {
    it('returns 200 with weekly report', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/reports/weekly?year=2025&week=1', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { year: number; week: number; entries: unknown[] } }
      expect(body.success).toBe(true)
      expect(body.data.year).toBe(2025)
      expect(body.data.week).toBe(1)
    })

    it('returns 422 for invalid week number', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/reports/weekly?year=2025&week=0', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 422 for missing params', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/statistics/reports/weekly', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(422)
    })
  })
})
