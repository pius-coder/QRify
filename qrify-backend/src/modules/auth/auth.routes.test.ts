import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { createAuthRouter } from './auth.routes'

describe('Auth Routes', () => {
  let app: Hono
  let db: SqliteAdapter

  beforeEach(() => {
    db = createTestDb()
    app = new Hono()
    app.route('/api/v1/auth', createAuthRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500 as ContentfulStatusCode)
    })
  })

  describe('POST /api/v1/auth/register/employee', () => {
    it('returns 400 if company does not exist', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/register/employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyCode: 'NONEXIST',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            password: 'password123',
          }),
        }),
      )

      expect(res.status).toBe(400)
      const body = await res.json() as { success: boolean }
      expect(body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/register/company', () => {
    it('returns 201 with valid data', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/register/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: 'Test Corp',
            companyCode: 'TEST01',
            timezone: 'UTC',
            adminFirstName: 'John',
            adminLastName: 'Doe',
            adminEmail: 'john@test.com',
            adminPassword: 'password123',
          }),
        }),
      )

      expect(res.status).toBe(201)
      const body = await res.json() as { success: boolean; data: { user: { email: string }; company: { code: string } } }
      expect(body.success).toBe(true)
      expect(body.data.user.email).toBe('john@test.com')
      expect(body.data.company.code).toBe('TEST01')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.fetch(
        new Request('http://localhost/api/v1/auth/register/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: 'Test Corp',
            companyCode: 'TEST01',
            timezone: 'UTC',
            adminFirstName: 'John',
            adminLastName: 'Doe',
            adminEmail: 'john@test.com',
            adminPassword: 'password123',
          }),
        }),
      )
    })

    it('returns 200 and sets cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@test.com',
            password: 'password123',
          }),
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { user: { email: string } } }
      expect(body.success).toBe(true)
      expect(body.data.user.email).toBe('john@test.com')

      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('qrify_token')
    })

    it('returns 401 with wrong password', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@test.com',
            password: 'wrongpassword',
          }),
        }),
      )

      expect(res.status).toBe(401)
      const body = await res.json() as { success: boolean }
      expect(body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('clears cookie and returns 200', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean }
      expect(body.success).toBe(true)

      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('Max-Age=0')
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/me', {
          method: 'GET',
        }),
      )

      expect(res.status).toBe(401)
    })
  })
})
