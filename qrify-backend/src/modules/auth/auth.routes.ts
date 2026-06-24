import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { IdService } from '../../services/id.service'
import { PasswordService } from '../../services/password.service'
import { TokenService } from '../../services/token.service'
import { validateOrThrow } from '../../utils/validate'
import { AuthService } from './auth.service'
import { registerCompanySchema, registerEmployeeSchema, loginSchema } from './auth.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'

export function createAuthRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const userRepo = new SqliteUserRepository(db)
  const companyRepo = new SqliteCompanyRepository(db)
  const idService = new IdService()
  const passwordService = new PasswordService()
  const tokenService = new TokenService()

  const authService = new AuthService(
    db,
    userRepo,
    companyRepo,
    idService,
    passwordService,
    tokenService,
  )

  const router = new Hono()

  router.post('/register/company', async (c: Context) => {
    const body = await c.req.json()
    const dto = await validateOrThrow(registerCompanySchema, body)
    const result = await authService.registerCompany(dto)
    return c.json({ success: true, data: result }, 201)
  })

  router.post('/register/employee', async (c: Context) => {
    const body = await c.req.json()
    const dto = await validateOrThrow(registerEmployeeSchema, body)
    const result = await authService.registerEmployee(dto)
    return c.json({ success: true, data: result }, 201)
  })

  router.post('/login', async (c: Context) => {
    const body = await c.req.json()
    const dto = await validateOrThrow(loginSchema, body)
    const { user, token } = await authService.login(dto)
    tokenService.setCookie(c, token)
    return c.json({ success: true, data: { user } })
  })

  router.post('/logout', async (c: Context) => {
    tokenService.clearCookie(c)
    return c.json({ success: true, data: { message: 'Logged out successfully' } })
  })

  router.get('/me', authMiddleware(), async (c: Context) => {
    const { sub } = c.get('user')
    const result = await authService.getUser(sub)
    return c.json({ success: true, data: result })
  })

  return router
}
