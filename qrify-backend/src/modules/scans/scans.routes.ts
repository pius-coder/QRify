import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { ClockService } from '../../services/clock.service'
import { validateOrThrow } from '../../utils/validate'
import { AttendanceService } from '../attendances/attendances.service'
import { ScanService } from './scans.service'
import { submitScanSchema } from './scans.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'

function createScanService(db: DatabaseAdapter): ScanService {
  const attendanceService = new AttendanceService(
    new SqliteAttendanceRepository(db),
    new SqliteScheduleRepository(db),
    new SqliteCompanyRepository(db),
    new SqliteScanEventRepository(db),
    new SqliteUserRepository(db),
    new ClockService(),
  )

  return new ScanService(
    db,
    new SqliteQrSessionRepository(db),
    new SqliteScanEventRepository(db),
    new SqliteUserRepository(db),
    new SqliteCompanyRepository(db),
    new ClockService(),
    attendanceService,
  )
}

export function createScansRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const scanService = createScanService(db)

  const router = new Hono()

  router.post('/', authMiddleware(), async (c: Context) => {
    const { sub: userId, companyId } = c.get('user')
    const body = await c.req.json()
    const dto = await validateOrThrow(submitScanSchema, body)
    const result = await scanService.processScan(userId!, companyId!, dto)
    return c.json({ success: true, data: { scan: result } }, 201)
  })

  return router
}
