import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SuperAdminService } from './super-admin.service'
import { SuperAdminCompanyNotFoundError, InvalidCompanyStatusTransitionError } from './super-admin.errors'

describe('SuperAdminService', () => {
  let adapter: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let userRepo: SqliteUserRepository
  let service: SuperAdminService

  beforeEach(() => {
    adapter = createTestDb()
    companyRepo = new SqliteCompanyRepository(adapter)
    userRepo = new SqliteUserRepository(adapter)
    service = new SuperAdminService(companyRepo, adapter)
  })

  describe('listCompanies', () => {
    beforeEach(async () => {
      await companyRepo.create({ id: 'comp-1', name: 'Alpha Corp', company_code: 'ALPHA01', timezone: 'UTC', status: 'ACTIVE' })
      await companyRepo.create({ id: 'comp-2', name: 'Beta Corp', company_code: 'BETA01', timezone: 'UTC', status: 'SUSPENDED' })
      await companyRepo.create({ id: 'comp-3', name: 'Gamma Inc', company_code: 'GAMMA01', timezone: 'UTC', status: 'ACTIVE' })
    })

    it('returns paginated companies', async () => {
      const result = await service.listCompanies({ page: 1, limit: 10 })
      expect(result.companies).toHaveLength(3)
      expect(result.meta.total).toBe(3)
      expect(result.meta.page).toBe(1)
      expect(result.meta.totalPages).toBe(1)
    })

    it('returns empty list when page exceeds data', async () => {
      const result = await service.listCompanies({ page: 10, limit: 10 })
      expect(result.companies).toHaveLength(0)
      expect(result.meta.total).toBe(3)
    })

    it('filters by status', async () => {
      const result = await service.listCompanies({ page: 1, limit: 10, status: 'SUSPENDED' })
      expect(result.companies).toHaveLength(1)
      expect(result.companies[0]!.companyCode).toBe('BETA01')
    })

    it('searches by name', async () => {
      const result = await service.listCompanies({ page: 1, limit: 10, search: 'Alpha' })
      expect(result.companies).toHaveLength(1)
      expect(result.companies[0]!.name).toBe('Alpha Corp')
    })

    it('searches by company code', async () => {
      const result = await service.listCompanies({ page: 1, limit: 10, search: 'GAMMA' })
      expect(result.companies).toHaveLength(1)
      expect(result.companies[0]!.companyCode).toBe('GAMMA01')
    })
  })

  describe('getCompany', () => {
    beforeEach(async () => {
      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
    })

    it('returns company detail', async () => {
      const result = await service.getCompany('comp-1')
      expect(result.id).toBe('comp-1')
      expect(result.name).toBe('Test Corp')
      expect(result.timezone).toBe('UTC')
    })

    it('throws SuperAdminCompanyNotFoundError for non-existent id', async () => {
      expect(service.getCompany('non-existent')).rejects.toThrow(SuperAdminCompanyNotFoundError)
    })
  })

  describe('updateCompanyStatus', () => {
    beforeEach(async () => {
      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
      await companyRepo.create({ id: 'comp-2', name: 'Suspended Corp', company_code: 'SUSP01', timezone: 'UTC', status: 'SUSPENDED' })
    })

    it('suspends an active company', async () => {
      const result = await service.updateCompanyStatus('comp-1', { status: 'SUSPENDED' })
      expect(result.status).toBe('SUSPENDED')
    })

    it('reactivates a suspended company', async () => {
      const result = await service.updateCompanyStatus('comp-2', { status: 'ACTIVE' })
      expect(result.status).toBe('ACTIVE')
    })

    it('throws InvalidCompanyStatusTransitionError for invalid transition', async () => {
      expect(service.updateCompanyStatus('comp-1', { status: 'ACTIVE' })).rejects.toThrow('Cannot transition company status from ACTIVE to ACTIVE')
    })

    it('throws SuperAdminCompanyNotFoundError for non-existent id', async () => {
      expect(service.updateCompanyStatus('non-existent', { status: 'SUSPENDED' })).rejects.toThrow(SuperAdminCompanyNotFoundError)
    })
  })

  describe('getStatistics', () => {
    beforeEach(async () => {
      await companyRepo.create({ id: 'comp-1', name: 'Active Corp', company_code: 'ACT01', timezone: 'UTC', status: 'ACTIVE' })
      await companyRepo.create({ id: 'comp-2', name: 'Suspended Corp', company_code: 'SUSP01', timezone: 'UTC', status: 'SUSPENDED' })

      await userRepo.create({ id: 'user-1', company_id: 'comp-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-2', company_id: 'comp-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-3', company_id: null, first_name: 'Super', last_name: 'Admin', email: 'super@test.com', password_hash: 'hash', role: 'SUPER_ADMIN', status: 'ACTIVE' })
    })

    it('returns correct aggregate counts', async () => {
      const stats = await service.getStatistics()
      expect(stats.totalCompanies).toBe(2)
      expect(stats.activeCompanies).toBe(1)
      expect(stats.suspendedCompanies).toBe(1)
      expect(stats.totalEmployees).toBe(2)
      expect(stats.todayScans).toBe(0)
      expect(stats.periodAttendance).toBe(0)
    })
  })
})
