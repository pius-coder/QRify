import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { authMiddleware } from './auth.middleware'

describe('authMiddleware', () => {
  it('returns 401 with no cookie', async () => {
    const app = new Hono()

    app.get('/test', authMiddleware(), (c) => {
      return c.json({ success: true })
    })

    const res = await app.fetch(new Request('http://localhost/test'))
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid cookie', async () => {
    const app = new Hono()

    app.get('/test', authMiddleware(), (c) => {
      return c.json({ success: true })
    })

    const res = await app.fetch(
      new Request('http://localhost/test', {
        headers: { Cookie: 'qrify_token=invalidtoken123' },
      }),
    )

    expect(res.status).toBe(401)
  })
})
