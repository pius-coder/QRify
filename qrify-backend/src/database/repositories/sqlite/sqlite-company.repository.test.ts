import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../adapters/sqlite.adapter'
import { SqliteCompanyRepository } from './sqlite-company.repository'
import { createTestDb } from '../../test-utils'

describe('SqliteCompanyRepository', () => {
  let adapter: SqliteAdapter
  let repo: SqliteCompanyRepository

  beforeEach(() => {
    adapter = createTestDb()
    repo = new SqliteCompanyRepository(adapter)
  })

  const sampleCompany = {
    id: 'comp-1',
    name: 'Test Corp',
    company_code: 'TEST01',
    timezone: 'Africa/Douala',
    status: 'ACTIVE',
  }

  describe('create', () => {
    it('creates a company with default timestamps', async () => {
      const company = await repo.create(sampleCompany)

      expect(company.id).toBe(sampleCompany.id)
      expect(company.name).toBe(sampleCompany.name)
      expect(company.company_code).toBe(sampleCompany.company_code)
      expect(company.timezone).toBe(sampleCompany.timezone)
      expect(company.status).toBe(sampleCompany.status)
      expect(company.created_at).toBeTruthy()
      expect(company.updated_at).toBeTruthy()
    })
  })

  describe('findById', () => {
    it('returns company by id', async () => {
      await repo.create(sampleCompany)

      const found = await repo.findById('comp-1')

      expect(found).not.toBeNull()
      expect(found?.name).toBe('Test Corp')
    })

    it('returns null for non-existent id', async () => {
      const found = await repo.findById('non-existent')

      expect(found).toBeNull()
    })
  })

  describe('findByCode', () => {
    it('returns company by code', async () => {
      await repo.create(sampleCompany)

      const found = await repo.findByCode('TEST01')

      expect(found).not.toBeNull()
      expect(found?.id).toBe('comp-1')
    })

    it('returns null for non-existent code', async () => {
      const found = await repo.findByCode('NONEXIST')

      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns all companies ordered by name', async () => {
      await repo.create({ ...sampleCompany, id: 'c2', company_code: 'BETA', name: 'Beta Inc' })
      await repo.create({ ...sampleCompany, id: 'c1', company_code: 'ALPHA', name: 'Alpha LLC' })

      const all = await repo.findAll()

      expect(all).toHaveLength(2)
      expect(all[0]?.name).toBe('Alpha LLC')
      expect(all[1]?.name).toBe('Beta Inc')
    })
  })

  describe('update', () => {
    it('updates company fields', async () => {
      await repo.create(sampleCompany)

      const updated = await repo.update('comp-1', { name: 'Updated Corp' })

      expect(updated?.name).toBe('Updated Corp')
      expect(updated?.company_code).toBe('TEST01')
    })

    it('returns null for non-existent id', async () => {
      const updated = await repo.update('non-existent', { name: 'Nope' })

      expect(updated).toBeNull()
    })
  })

  describe('existsByCode', () => {
    it('returns true for existing code', async () => {
      await repo.create(sampleCompany)

      const exists = await repo.existsByCode('TEST01')

      expect(exists).toBeTrue()
    })

    it('returns false for non-existent code', async () => {
      const exists = await repo.existsByCode('NONEXIST')

      expect(exists).toBeFalse()
    })
  })
})
