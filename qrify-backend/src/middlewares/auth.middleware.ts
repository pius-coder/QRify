import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { env } from '../config/env'
import { AUTH_CONFIG } from '../config/auth.config'
import { UnauthorizedError } from '../utils/errors'
import type { JwtPayload } from '../modules/auth/auth.types'

export function authMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const token = getCookie(c, AUTH_CONFIG.COOKIE_NAME)
    if (!token) {
      throw new UnauthorizedError()
    }

    try {
      const payload = await verify(token, env.JWT_SECRET, AUTH_CONFIG.JWT_ALGORITHM) as unknown as JwtPayload
      c.set('user', payload)
      await next()
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }
  }
}
