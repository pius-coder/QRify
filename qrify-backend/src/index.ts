import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { env } from './config/env'
import { ApiError, NotFoundError, formatErrorResponse } from './utils/errors'
import { createAuthRouter } from './modules/auth/auth.routes'
import { createCompaniesRouter } from './modules/companies/companies.routes'
import { createScheduleRouter } from './modules/schedules/schedules.routes'
import { createQrRouter, createPublicQrRouter } from './modules/qr/qr.routes'
import { createEmployeesRouter } from './modules/employees/employees.routes'
import { createSuperAdminRouter } from './modules/super-admin/super-admin.routes'
import { createStatisticsRouter } from './modules/statistics/statistics.routes'
import { createScansRouter } from './modules/scans/scans.routes'
import { createAttendancesRouter } from './modules/attendances/attendances.routes'
import { AttendanceService } from './modules/attendances/attendances.service'
import { AbsenceJobRunner } from './modules/attendances/absence-job-runner'
import { getDatabase } from './database/database.factory'
import { SqliteAttendanceRepository } from './database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteCompanyRepository } from './database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from './database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteScanEventRepository } from './database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from './database/repositories/sqlite/sqlite-user.repository'
import { ClockService } from './services/clock.service'
import { createMeRouter } from './modules/me/me.routes'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

app.get('/api/v1/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  })
})

app.route('/api/v1/auth', createAuthRouter())
app.route('/api/v1/company', createCompaniesRouter())
app.route('/api/v1/company/schedule', createScheduleRouter())
app.route('/api/v1/company/qr', createQrRouter())
app.route('/api/v1/public/companies', createPublicQrRouter())
app.route('/api/v1/employees', createEmployeesRouter())
app.route('/api/v1/super-admin', createSuperAdminRouter())
app.route('/api/v1/company/statistics', createStatisticsRouter())
app.route('/api/v1/me', createMeRouter())
app.route('/api/v1/scans', createScansRouter())
app.route('/api/v1/attendances', createAttendancesRouter())

app.onError((err, c) => {
  console.error('Unexpected error:', err)
  
  if (err instanceof ApiError) {
    return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
  }
  
  return c.json(
    formatErrorResponse(err),
    500 as ContentfulStatusCode
  )
})

app.notFound((c) => {
  return c.json(
    formatErrorResponse(new NotFoundError()),
    404 as ContentfulStatusCode
  )
})

export default {
  port: env.PORT,
  fetch: app.fetch,
}
