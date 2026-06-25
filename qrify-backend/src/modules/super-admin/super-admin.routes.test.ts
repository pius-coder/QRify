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
import { createSuperAdminRouter } from './super-admin.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Super Admin Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let superAdminToken: string
  let companyAdminToken: string
  let companyId: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)

    await companyRepo.create({
      id: 'comp-1', name: 'Alpha Corp', company_code: 'ALPHA01', timezone: 'UTC', status: 'ACTIVE',
    })
    await companyRepo.create({
      id: 'comp-2', name: 'Beta Corp', company_code: 'BETA01', timezone: 'UTC', status: 'SUSPENDED',
    })
    companyId = 'comp-1'

    const superAdminUser = await userRepo.create({
      id: 'super-admin-id', company_id: null, first_name: 'Super', last_name: 'Admin', email: 'super@test.com', password_hash: 'hash', role: 'SUPER_ADMIN', status: 'ACTIVE',
    })

    const companyAdminUser = await userRepo.create({
      id: 'company-admin-id', company_id: companyId, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', password_hash: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE',
    })

    superAdminToken = await sign(
      { sub: superAdminUser.id, role: 'SUPER_ADMIN', companyId: null, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET, 'HS256',
    )

    companyAdminToken = await sign(
      { sub: companyAdminUser.id, role: 'COMPANY_ADMIN', companyId, status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET, 'HS256',
    )

    app = new Hono()
    app.route('/api/v1/super-admin', createSuperAdminRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/super-admin/companies', () => {
    it('returns 200 with paginated companies', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies', {
          headers: { Cookie: createAuthCookie(superAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { companies: unknown[]; meta: { total: number } } }
      expect(body.success).toBe(true)
      expect(body.data.companies).toHaveLength(2)
      expect(body.data.meta.total).toBe(2)
    })

    it('filters by status', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies?status=SUSPENDED', {
          headers: { Cookie: createAuthCookie(superAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { companies: { status: string }[] } }
      expect(body.data.companies).toHaveLength(1)
      expect(body.data.companies[0]!.status).toBe('SUSPENDED')
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(403)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies'),
      )
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/super-admin/companies/:id', () => {
    it('returns 200 with company detail', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/super-admin/companies/${companyId}`, {
          headers: { Cookie: createAuthCookie(superAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { company: { name: string } } }
      expect(body.success).toBe(true)
      expect(body.data.company.name).toBe('Alpha Corp')
    })

    it('returns 404 for non-existent company', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies/non-existent', {
          headers: { Cookie: createAuthCookie(superAdminToken) },
        }),
      )
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/super-admin/companies/:id/status', () => {
    it('suspends an active company', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/super-admin/companies/${companyId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: createAuthCookie(superAdminToken) },
          body: JSON.stringify({ status: 'SUSPENDED' }),
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { company: { status: string } } }
      expect(body.data.company.status).toBe('SUSPENDED')
    })

    it('reactivates a suspended company', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/companies/comp-2/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: createAuthCookie(superAdminToken) },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { company: { status: string } } }
      expect(body.data.company.status).toBe('ACTIVE')
    })

    it('returns 422 for invalid status value', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/super-admin/companies/${companyId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: createAuthCookie(superAdminToken) },
          body: JSON.stringify({ status: 'INVALID' }),
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request(`http://localhost/api/v1/super-admin/companies/${companyId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: createAuthCookie(companyAdminToken) },
          body: JSON.stringify({ status: 'SUSPENDED' }),
        }),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/super-admin/statistics', () => {
    it('returns 200 with statistics', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/statistics', {
          headers: { Cookie: createAuthCookie(superAdminToken) },
        }),
      )
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { statistics: { totalCompanies: number } } }
      expect(body.success).toBe(true)
      expect(body.data.statistics.totalCompanies).toBe(2)
    })

    it('returns 403 for COMPANY_ADMIN', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/super-admin/statistics', {
          headers: { Cookie: createAuthCookie(companyAdminToken) },
        }),
      )
      expect(res.status).toBe(403)
    })
  })
})
