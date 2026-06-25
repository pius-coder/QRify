import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { CompaniesService } from './companies.service'

describe('CompaniesService', () => {
  let adapter: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let companiesService: CompaniesService
  let companyId: string

  beforeEach(() => {
    adapter = createTestDb()
    companyRepo = new SqliteCompanyRepository(adapter)
    companiesService = new CompaniesService(companyRepo)
  })

  describe('getProfile', () => {
    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id
    })

    it('returns company profile for valid companyId', async () => {
      const result = await companiesService.getProfile(companyId)

      expect(result.id).toBe(companyId)
      expect(result.name).toBe('Test Corp')
      expect(result.companyCode).toBe('TEST01')
      expect(result.timezone).toBe('UTC')
      expect(result.status).toBe('ACTIVE')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('throws for non-existent companyId', async () => {
      expect(
        companiesService.getProfile('non-existent-id'),
      ).rejects.toThrow('Company profile not found')
    })
  })

  describe('updateProfile', () => {
    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id
    })

    it('updates name and timezone', async () => {
      const result = await companiesService.updateProfile(companyId, {
        name: 'Updated Corp',
        timezone: 'America/New_York',
      })

      expect(result.name).toBe('Updated Corp')
      expect(result.timezone).toBe('America/New_York')
      expect(result.companyCode).toBe('TEST01')
      expect(result.status).toBe('ACTIVE')
    })

    it('throws for suspended company', async () => {
      await companyRepo.update(companyId, { status: 'SUSPENDED' })

      expect(
        companiesService.updateProfile(companyId, {
          name: 'Updated Corp',
          timezone: 'UTC',
        }),
      ).rejects.toThrow('suspended')
    })

    it('throws for non-existent companyId', async () => {
      expect(
        companiesService.updateProfile('non-existent-id', {
          name: 'Updated Corp',
          timezone: 'UTC',
        }),
      ).rejects.toThrow('Company profile not found')
    })
  })

  describe('getCompanyCode', () => {
    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id
    })

    it('returns company code for valid companyId', async () => {
      const result = await companiesService.getCompanyCode(companyId)
      expect(result.companyCode).toBe('TEST01')
    })

    it('throws for non-existent companyId', async () => {
      expect(
        companiesService.getCompanyCode('non-existent-id'),
      ).rejects.toThrow('Company profile not found')
    })
  })
})
