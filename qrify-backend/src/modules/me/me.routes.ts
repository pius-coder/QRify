import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { validateOrThrow } from '../../utils/validate'
import { MeService } from './me.service'
import { dateRangeSchema, updateProfileSchema } from './me.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createMeRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const attendanceRepo = new SqliteAttendanceRepository(db)
  const scanEventRepo = new SqliteScanEventRepository(db)
  const userRepo = new SqliteUserRepository(db)
  const meService = new MeService(attendanceRepo, scanEventRepo, userRepo)

  const router = new Hono()

  router.get('/attendance/today', authMiddleware(), roleMiddleware('EMPLOYEE'), async (c: Context) => {
    const { sub, companyId } = c.get('user')
    const result = await meService.getTodayAttendance(sub!, companyId!)
    return c.json({ success: true, data: result })
  })

  router.get('/attendances', authMiddleware(), roleMiddleware('EMPLOYEE'), async (c: Context) => {
    const { sub } = c.get('user')
    const query = await validateOrThrow(dateRangeSchema, {
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
    })
    const result = await meService.getAttendances(sub!, query.startDate, query.endDate)
    return c.json({ success: true, data: result })
  })

  router.get('/attendances/:date', authMiddleware(), roleMiddleware('EMPLOYEE'), async (c: Context) => {
    const { sub } = c.get('user')
    const date = c.req.param('date') as string
    const result = await meService.getAttendanceByDate(sub!, date)
    return c.json({ success: true, data: result })
  })

  router.get('/attendance-summary', authMiddleware(), roleMiddleware('EMPLOYEE'), async (c: Context) => {
    const { sub } = c.get('user')
    const query = await validateOrThrow(dateRangeSchema, {
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
    })
    const result = await meService.getAttendanceSummary(sub!, query.startDate, query.endDate)
    return c.json({ success: true, data: result })
  })

  router.put('/profile', authMiddleware(), roleMiddleware('EMPLOYEE'), async (c: Context) => {
    const { sub } = c.get('user')
    const body = await c.req.json()
    const dto = await validateOrThrow(updateProfileSchema, body)
    const result = await meService.updateProfile(sub!, dto)
    return c.json({ success: true, data: { user: result } })
  })

  return router
}
