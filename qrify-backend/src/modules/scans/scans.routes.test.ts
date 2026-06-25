import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { createHash } from 'node:crypto'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { ApiError, formatErrorResponse } from '../../utils/errors'
import { AUTH_CONFIG } from '../../config/auth.config'
import { createScansRouter } from './scans.routes'

const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-12345'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function createAuthCookie(token: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}=${token}`
}

describe('Scans Routes', () => {
  let app: Hono
  let db: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let qrSessionRepo: SqliteQrSessionRepository
  let employeeToken: string

  beforeEach(async () => {
    db = createTestDb()
    companyRepo = new SqliteCompanyRepository(db)
    userRepo = new SqliteUserRepository(db)
    qrSessionRepo = new SqliteQrSessionRepository(db)

    await companyRepo.create({
      id: 'test-company-id',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
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

    await qrSessionRepo.create({
      company_id: 'test-company-id',
      work_date: '2026-06-25',
      event_type: 'ARRIVAL',
      token_hash: hashToken('a'.repeat(64)),
      valid_from: '2026-06-25T07:30:00.000Z',
      valid_until: '2099-12-31T23:59:00.000Z',
      status: 'ACTIVE',
    })

    employeeToken = await sign(
      { sub: 'employee-user-id', role: 'EMPLOYEE', companyId: 'test-company-id', status: 'ACTIVE', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
      'HS256',
    )

    app = new Hono()
    app.route('/api/v1/scans', createScansRouter(db))
    app.onError((err, c) => {
      if (err instanceof ApiError) {
        return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
      }
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }, 500)
    })
  })

  describe('POST /api/v1/scans', () => {
    it('returns 201 with accepted scan', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/scans', {
          method: 'POST',
          headers: {
            Cookie: createAuthCookie(employeeToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: 'a'.repeat(64) }),
        }),
      )
      expect(res.status).toBe(201)
      const body = await res.json() as { success: boolean; data: { scan: { result: string; eventType: string } } }
      expect(body.success).toBe(true)
      expect(body.data.scan.result).toBe('ACCEPTED')
      expect(body.data.scan.eventType).toBe('ARRIVAL')
    })

    it('returns 401 without auth cookie', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'a'.repeat(64) }),
        }),
      )
      expect(res.status).toBe(401)
    })

    it('returns 400 with invalid token format', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/scans', {
          method: 'POST',
          headers: {
            Cookie: createAuthCookie(employeeToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: 'too-short' }),
        }),
      )
      expect(res.status).toBe(422)
    })

    it('returns 400 with unknown token', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/scans', {
          method: 'POST',
          headers: {
            Cookie: createAuthCookie(employeeToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: 'b'.repeat(64) }),
        }),
      )
      expect(res.status).toBe(400)
      const body = await res.json() as { success: boolean; error: { code: string } }
      expect(body.error.code).toBe('BAD_REQUEST')
    })
  })
})
