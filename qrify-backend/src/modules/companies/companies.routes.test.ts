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
import { createCompaniesRouter } from './companies.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Companies Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let adminToken: string
  let employeeToken: string
  let companyId: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)

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
    app.route('/api/v1/company', createCompaniesRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/company', () => {
    it('returns 200 with company profile', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { company: { name: string; companyCode: string } } }
      expect(body.success).toBe(true)
      expect(body.data.company.name).toBe('Test Corp')
      expect(body.data.company.companyCode).toBe('TEST01')
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', { method: 'GET' }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/v1/company', () => {
    it('returns 200 with updated company', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({
            name: 'Updated Corp',
            timezone: 'America/New_York',
          }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { company: { name: string; timezone: string } } }
      expect(body.success).toBe(true)
      expect(body.data.company.name).toBe('Updated Corp')
      expect(body.data.company.timezone).toBe('America/New_York')
    })

    it('returns 422 with invalid body', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ name: '', timezone: '' }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(employeeToken),
          },
          body: JSON.stringify({
            name: 'Updated Corp',
            timezone: 'UTC',
          }),
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/company/code', () => {
    it('returns 200 with company code', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/code', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { companyCode: string } }
      expect(body.success).toBe(true)
      expect(body.data.companyCode).toBe('TEST01')
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/code', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(403)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/company/code', {
          method: 'GET',
        }),
      )

      expect(res.status).toBe(401)
    })
  })
})
