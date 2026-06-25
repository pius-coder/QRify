import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { EmployeeService } from './employees.service'
import { CannotModifyCompanyAdminError, EmployeeNotFoundError, EmployeeNotInCompanyError, InvalidStatusTransitionError } from './employees.errors'

describe('EmployeeService', () => {
  let adapter: SqliteAdapter
  let userRepo: SqliteUserRepository
  let companyRepo: SqliteCompanyRepository
  let service: EmployeeService
  let companyId: string

  beforeEach(async () => {
    adapter = createTestDb()
    userRepo = new SqliteUserRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)
    service = new EmployeeService(userRepo)

    const company = await companyRepo.create({
      id: 'comp-1',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })
    companyId = company.id
  })

  describe('list', () => {
    it('returns only EMPLOYEE role users', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })
      await userRepo.create({
        id: 'admin-1', company_id: companyId, first_name: 'Admin', last_name: 'User',
        email: 'admin@test.com', password_hash: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE',
      })

      const result = await service.list(companyId)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('emp-1')
    })

    it('returns empty array when no employees', async () => {
      const result = await service.list(companyId)

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('returns employee by id', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })

      const result = await service.getById(companyId, 'emp-1')

      expect(result.id).toBe('emp-1')
      expect(result.firstName).toBe('John')
      expect(result.companyId).toBe(companyId)
    })

    it('throws EmployeeNotFoundError for non-existent id', async () => {
      await expect(service.getById(companyId, 'non-existent')).rejects.toThrow(EmployeeNotFoundError)
    })

    it('throws EmployeeNotInCompanyError for wrong company', async () => {
      const otherCompany = await companyRepo.create({
        id: 'comp-2', name: 'Other Corp', company_code: 'OTHER01', timezone: 'UTC', status: 'ACTIVE',
      })
      await userRepo.create({
        id: 'emp-1', company_id: otherCompany.id, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })

      await expect(service.getById(companyId, 'emp-1')).rejects.toThrow(EmployeeNotInCompanyError)
    })
  })

  describe('update', () => {
    it('updates employee fields', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })

      const result = await service.update(companyId, 'emp-1', { firstName: 'Jane' })

      expect(result.firstName).toBe('Jane')
      expect(result.lastName).toBe('Doe')
    })

    it('throws EmployeeNotFoundError for non-existent id', async () => {
      await expect(service.update(companyId, 'non-existent', { firstName: 'Jane' })).rejects.toThrow(EmployeeNotFoundError)
    })

    it('throws CannotModifyCompanyAdminError for COMPANY_ADMIN', async () => {
      await userRepo.create({
        id: 'admin-1', company_id: companyId, first_name: 'Admin', last_name: 'User',
        email: 'admin@test.com', password_hash: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE',
      })

      await expect(service.update(companyId, 'admin-1', { firstName: 'Hacker' })).rejects.toThrow(CannotModifyCompanyAdminError)
    })

    it('throws ConflictError when email is taken by another user', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })
      await userRepo.create({
        id: 'emp-2', company_id: companyId, first_name: 'Jane', last_name: 'Smith',
        email: 'jane@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })

      await expect(service.update(companyId, 'emp-1', { email: 'jane@test.com' })).rejects.toThrow('A user with this email already exists')
    })
  })

  describe('updateStatus', () => {
    it('approves PENDING to ACTIVE', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'PENDING',
      })

      const result = await service.updateStatus(companyId, 'emp-1', { status: 'ACTIVE' })

      expect(result.status).toBe('ACTIVE')
    })

    it('rejects PENDING to REJECTED', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'PENDING',
      })

      const result = await service.updateStatus(companyId, 'emp-1', { status: 'REJECTED' })

      expect(result.status).toBe('REJECTED')
    })

    it('suspends ACTIVE to SUSPENDED', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE',
      })

      const result = await service.updateStatus(companyId, 'emp-1', { status: 'SUSPENDED' })

      expect(result.status).toBe('SUSPENDED')
    })

    it('reactivates SUSPENDED to ACTIVE', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'SUSPENDED',
      })

      const result = await service.updateStatus(companyId, 'emp-1', { status: 'ACTIVE' })

      expect(result.status).toBe('ACTIVE')
    })

    it('throws InvalidStatusTransitionError for invalid transition', async () => {
      await userRepo.create({
        id: 'emp-1', company_id: companyId, first_name: 'John', last_name: 'Doe',
        email: 'john@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'PENDING',
      })

      await expect(service.updateStatus(companyId, 'emp-1', { status: 'SUSPENDED' })).rejects.toThrow(InvalidStatusTransitionError)
    })

    it('throws EmployeeNotFoundError for non-existent id', async () => {
      await expect(service.updateStatus(companyId, 'non-existent', { status: 'ACTIVE' })).rejects.toThrow(EmployeeNotFoundError)
    })

    it('throws CannotModifyCompanyAdminError for COMPANY_ADMIN', async () => {
      await userRepo.create({
        id: 'admin-1', company_id: companyId, first_name: 'Admin', last_name: 'User',
        email: 'admin@test.com', password_hash: 'hash', role: 'COMPANY_ADMIN', status: 'ACTIVE',
      })

      await expect(service.updateStatus(companyId, 'admin-1', { status: 'SUSPENDED' })).rejects.toThrow(CannotModifyCompanyAdminError)
    })
  })
})
