import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { validateOrThrow } from '../../utils/validate'
import { CompaniesService } from './companies.service'
import { updateCompanySchema } from './companies.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createCompaniesRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const companyRepo = new SqliteCompanyRepository(db)
  const companiesService = new CompaniesService(companyRepo)

  const router = new Hono()

  router.get('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const result = await companiesService.getProfile(companyId!)
    return c.json({ success: true, data: { company: result } })
  })

  router.put('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const body = await c.req.json()
    const dto = await validateOrThrow(updateCompanySchema, body)
    const result = await companiesService.updateProfile(companyId!, dto)
    return c.json({ success: true, data: { company: result } })
  })

  router.get('/code', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const result = await companiesService.getCompanyCode(companyId!)
    return c.json({ success: true, data: result })
  })

  return router
}
