import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { ClockService } from '../../services/clock.service'
import { QrSessionService } from './qr.service'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import { NoActiveQrError, NotWorkingDayError } from './qr.errors'
import { BadRequestError } from '../../utils/errors'

function createQrService(db: DatabaseAdapter): QrSessionService {
  const companyRepo = new SqliteCompanyRepository(db)
  const scheduleRepo = new SqliteScheduleRepository(db)
  const qrSessionRepo = new SqliteQrSessionRepository(db)
  const clockService = new ClockService()
  return new QrSessionService(companyRepo, scheduleRepo, qrSessionRepo, clockService)
}

export function createQrRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const qrService = createQrService(db)

  const router = new Hono()

  router.get('/status', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')

    try {
      const result = await qrService.getOrCreateActiveSession(companyId!)
      return c.json({ success: true, data: { activeQr: result } })
    } catch (err) {
      if (err instanceof NoActiveQrError || err instanceof NotWorkingDayError) {
        return c.json({ success: true, data: { activeQr: null } })
      }
      throw err
    }
  })

  return router
}

export function createPublicQrRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const qrService = createQrService(db)

  const router = new Hono()

  router.get('/:companyCode/active-qr', async (c: Context) => {
    const companyCode = c.req.param('companyCode')
    if (!companyCode) throw new BadRequestError('Company code is required')
    const result = await qrService.getActiveQrByCompanyCode(companyCode)
    return c.json({ success: true, data: { activeQr: result } })
  })

  return router
}
