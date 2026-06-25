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
import { createEmployeesRouter } from './employees.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Employees Routes', () => {
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
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'pending-employee-id',
      company_id: companyId,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'PENDING',
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
    app.route('/api/v1/employees', createEmployeesRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('GET /api/v1/employees', () => {
    it('returns 200 with employees list', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { employees: Array<{ id: string; firstName: string }> } }
      expect(body.success).toBe(true)
      expect(body.data.employees).toHaveLength(2)
      expect(body.data.employees.every((e) => e.firstName !== 'Admin')).toBe(true)
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees', { method: 'GET' }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/employees/:id', () => {
    it('returns 200 with employee', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/employee-user-id', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { employee: { id: string; firstName: string } } }
      expect(body.success).toBe(true)
      expect(body.data.employee.id).toBe('employee-user-id')
      expect(body.data.employee.firstName).toBe('John')
    })

    it('returns 404 for non-existent employee', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/non-existent', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(adminToken) },
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 403 for EMPLOYEE role', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/employee-user-id', {
          method: 'GET',
          headers: { Cookie: createAuthCookie(employeeToken) },
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/v1/employees/:id', () => {
    it('returns 200 with updated employee', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/employee-user-id', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ firstName: 'Johnny' }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { employee: { id: string; firstName: string } } }
      expect(body.success).toBe(true)
      expect(body.data.employee.firstName).toBe('Johnny')
    })

    it('returns 422 with invalid body', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/employee-user-id', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ firstName: '' }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 404 for non-existent employee', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/non-existent', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ firstName: 'Test' }),
        }),
      )

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/employees/:id/status', () => {
    it('returns 200 with updated status', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/pending-employee-id/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { employee: { id: string; status: string } } }
      expect(body.success).toBe(true)
      expect(body.data.employee.status).toBe('ACTIVE')
    })

    it('returns 422 for invalid status value', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/pending-employee-id/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ status: 'INVALID' }),
        }),
      )

      expect(res.status).toBe(422)
    })

    it('returns 404 for non-existent employee', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/employees/non-existent/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: createAuthCookie(adminToken),
          },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }),
      )

      expect(res.status).toBe(404)
    })
  })
})
