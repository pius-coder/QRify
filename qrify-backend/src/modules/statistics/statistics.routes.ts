import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteStatisticsRepository } from '../../database/repositories/sqlite/sqlite-statistics.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { validateOrThrow } from '../../utils/validate'
import { StatisticsService } from './statistics.service'
import { periodQuerySchema, rankingsQuerySchema, weeklyReportQuerySchema } from './statistics.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createStatisticsRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const statsRepo = new SqliteStatisticsRepository(db)
  const qrSessionRepo = new SqliteQrSessionRepository(db)
  const statisticsService = new StatisticsService(statsRepo, qrSessionRepo)

  const router = new Hono()

  router.get('/dashboard', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const user = c.get('user') as { companyId: string }
    const result = await statisticsService.getDashboard(user.companyId)
    return c.json({ success: true, data: result })
  })

  router.get('/attendance', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const user = c.get('user') as { companyId: string }
    const query = await validateOrThrow(periodQuerySchema, c.req.query())
    const result = await statisticsService.getAttendance(user.companyId, query.startDate, query.endDate)
    return c.json({ success: true, data: result })
  })

  router.get('/rankings', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const user = c.get('user') as { companyId: string }
    const query = await validateOrThrow(rankingsQuerySchema, c.req.query())
    const result = await statisticsService.getRankings(user.companyId, query.type, query.startDate, query.endDate)
    return c.json({ success: true, data: result })
  })

  router.get('/reports/weekly', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const user = c.get('user') as { companyId: string }
    const query = await validateOrThrow(weeklyReportQuerySchema, c.req.query())
    const result = await statisticsService.getWeeklyReport(user.companyId, query.year, query.week)
    return c.json({ success: true, data: result })
  })

  return router
}
