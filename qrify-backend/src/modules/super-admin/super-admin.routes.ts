import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { validateOrThrow } from '../../utils/validate'
import { SuperAdminService } from './super-admin.service'
import { updateCompanyStatusSchema, listCompaniesQuerySchema } from './super-admin.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createSuperAdminRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const companyRepo = new SqliteCompanyRepository(db)
  const superAdminService = new SuperAdminService(companyRepo, db)

  const router = new Hono()

  router.get('/companies', authMiddleware(), roleMiddleware('SUPER_ADMIN'), async (c: Context) => {
    const query = await validateOrThrow(listCompaniesQuerySchema, c.req.query())
    const result = await superAdminService.listCompanies(query)
    return c.json({ success: true, data: result })
  })

  router.get('/companies/:id', authMiddleware(), roleMiddleware('SUPER_ADMIN'), async (c: Context) => {
    const id = c.req.param('id') as string
    const result = await superAdminService.getCompany(id)
    return c.json({ success: true, data: { company: result } })
  })

  router.patch('/companies/:id/status', authMiddleware(), roleMiddleware('SUPER_ADMIN'), async (c: Context) => {
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const dto = await validateOrThrow(updateCompanyStatusSchema, body)
    const result = await superAdminService.updateCompanyStatus(id, dto)
    return c.json({ success: true, data: { company: result } })
  })

  router.get('/statistics', authMiddleware(), roleMiddleware('SUPER_ADMIN'), async (c: Context) => {
    const result = await superAdminService.getStatistics()
    return c.json({ success: true, data: { statistics: result } })
  })

  return router
}
