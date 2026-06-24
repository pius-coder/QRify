import type { MiddlewareHandler } from 'hono'
import { ForbiddenError } from '../utils/errors'

export function tenantMiddleware(getResourceCompanyId: (c: Parameters<MiddlewareHandler>[0]) => string | null): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user')
    if (!user) {
      throw new ForbiddenError('Authentication required')
    }

    if (user.role === 'SUPER_ADMIN') {
      await next()
      return
    }

    const resourceCompanyId = getResourceCompanyId(c)
    if (resourceCompanyId && resourceCompanyId !== user.companyId) {
      throw new ForbiddenError('Access denied: cross-tenant access not allowed')
    }

    await next()
  }
}
