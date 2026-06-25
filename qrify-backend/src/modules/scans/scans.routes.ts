import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { ClockService } from '../../services/clock.service'
import { validateOrThrow } from '../../utils/validate'
import { ScanService } from './scans.service'
import { submitScanSchema } from './scans.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'

function createScanService(db: DatabaseAdapter): ScanService {
  return new ScanService(
    db,
    new SqliteQrSessionRepository(db),
    new SqliteScanEventRepository(db),
    new SqliteUserRepository(db),
    new SqliteCompanyRepository(db),
    new ClockService(),
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
