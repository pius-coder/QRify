import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { validateOrThrow } from '../../utils/validate'
import { SchedulesService } from './schedules.service'
import { updateScheduleSchema } from './schedules.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createScheduleRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const companyRepo = new SqliteCompanyRepository(db)
  const scheduleRepo = new SqliteScheduleRepository(db)
  const schedulesService = new SchedulesService(companyRepo, scheduleRepo)

  const router = new Hono()

  router.get('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const result = await schedulesService.getSchedule(companyId!)
    return c.json({ success: true, data: { schedule: result } })
  })

  router.put('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const body = await c.req.json()
    const dto = await validateOrThrow(updateScheduleSchema, body)
    const result = await schedulesService.upsertSchedule(companyId!, dto)
    return c.json({ success: true, data: { schedule: result } })
  })

  return router
}
