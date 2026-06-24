import type { MiddlewareHandler } from 'hono'
import { ForbiddenError } from '../utils/errors'

export function roleMiddleware(...roles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions')
    }
    await next()
  }
}
