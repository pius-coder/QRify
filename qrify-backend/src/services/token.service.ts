import { sign, verify } from 'hono/jwt'
import type { Context } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { env } from '../config/env'
import { AUTH_CONFIG } from '../config/auth.config'
import type { JwtPayload } from '../modules/auth/auth.types'

export class TokenService {
  async createToken(payload: JwtPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    return sign(
      {
        ...payload,
        iat: now,
        exp: now + AUTH_CONFIG.COOKIE_MAX_AGE,
      },
      env.JWT_SECRET,
      AUTH_CONFIG.JWT_ALGORITHM,
    )
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return verify(token, env.JWT_SECRET, AUTH_CONFIG.JWT_ALGORITHM) as unknown as Promise<JwtPayload>
  }

  setCookie(c: Context, token: string): void {
    setCookie(c, AUTH_CONFIG.COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: AUTH_CONFIG.COOKIE_PATH,
      maxAge: AUTH_CONFIG.COOKIE_MAX_AGE,
    })
  }

  clearCookie(c: Context): void {
    deleteCookie(c, AUTH_CONFIG.COOKIE_NAME, { path: AUTH_CONFIG.COOKIE_PATH })
  }

  extractToken(c: Context): string | undefined {
    return getCookie(c, AUTH_CONFIG.COOKIE_NAME)
  }
}
