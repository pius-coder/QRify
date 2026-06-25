import { Hono } from 'hono'
import type { Context } from 'hono'
import type { DatabaseAdapter } from '../../database/database.types'
import { getDatabase } from '../../database/database.factory'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { validateOrThrow } from '../../utils/validate'
import { EmployeeService } from './employees.service'
import { updateEmployeeSchema, updateEmployeeStatusSchema } from './employees.schema'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'

export function createEmployeesRouter(dbOverride?: DatabaseAdapter): Hono {
  const db = dbOverride ?? getDatabase()
  const userRepo = new SqliteUserRepository(db)
  const employeeService = new EmployeeService(userRepo)

  const router = new Hono()

  router.get('/', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const result = await employeeService.list(companyId!)
    return c.json({ success: true, data: { employees: result } })
  })

  router.get('/:id', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const id = c.req.param('id') as string
    const result = await employeeService.getById(companyId!, id)
    return c.json({ success: true, data: { employee: result } })
  })

  router.put('/:id', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const dto = await validateOrThrow(updateEmployeeSchema, body)
    const result = await employeeService.update(companyId!, id, dto)
    return c.json({ success: true, data: { employee: result } })
  })

  router.patch('/:id/status', authMiddleware(), roleMiddleware('COMPANY_ADMIN'), async (c: Context) => {
    const { companyId } = c.get('user')
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const dto = await validateOrThrow(updateEmployeeStatusSchema, body)
    const result = await employeeService.updateStatus(companyId!, id, dto)
    return c.json({ success: true, data: { employee: result } })
  })

  return router
}
