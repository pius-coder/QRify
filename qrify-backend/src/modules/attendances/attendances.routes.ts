import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { validateOrThrow } from '../../utils/validate'
import { AttendanceService } from './attendances.service'
import { listAttendancesQuerySchema } from './attendances.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import { ClockService } from '../../services/clock.service'

function createAttendanceService(db: DatabaseAdapter): AttendanceService {
  return new AttendanceService(
    new SqliteAttendanceRepository(db),
    new SqliteScheduleRepository(db),
    new SqliteCompanyRepository(db),
    new SqliteScanEventRepository(db),
    new SqliteUserRepository(db),
    new ClockService(),
  )
}

export function createAttendancesRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const attendanceService = createAttendanceService(db)

  const router = new Hono()

  router.get('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const query = await validateOrThrow(listAttendancesQuerySchema, c.req.query())
    const result = await attendanceService.list(companyId!, query)
    return c.json({ success: true, data: result })
  })

  router.get('/:id', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const id = c.req.param('id') as string
    const result = await attendanceService.getById(companyId!, id)
    return c.json({ success: true, data: { attendance: result } })
  })

  router.post('/run-absence-detection', authMiddleware(), roleMiddleware('SUPER_ADMIN'), async (c: Context) => {
    const count = await attendanceService.runAbsenceDetection()
    return c.json({ success: true, data: { markedAbsent: count } })
  })

  return router
}
