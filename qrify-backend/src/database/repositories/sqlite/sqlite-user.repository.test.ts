import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../adapters/sqlite.adapter'
import { SqliteCompanyRepository } from './sqlite-company.repository'
import { SqliteUserRepository } from './sqlite-user.repository'
import { createTestDb } from '../../test-utils'

describe('SqliteUserRepository', () => {
  let adapter: SqliteAdapter
  let userRepo: SqliteUserRepository
  let companyRepo: SqliteCompanyRepository

  beforeEach(async () => {
    adapter = createTestDb()
    userRepo = new SqliteUserRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)

    await companyRepo.create({
      id: 'comp-1',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'Africa/Douala',
      status: 'ACTIVE',
    })
  })

  const sampleUser = {
    id: 'user-1',
    company_id: 'comp-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@test.com',
    password_hash: 'hashed_password',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  }

  describe('create', () => {
    it('creates a user with default timestamps', async () => {
      const user = await userRepo.create(sampleUser)

      expect(user.id).toBe(sampleUser.id)
      expect(user.email).toBe(sampleUser.email)
      expect(user.first_name).toBe(sampleUser.first_name)
      expect(user.role).toBe(sampleUser.role)
      expect(user.company_id).toBe('comp-1')
      expect(user.created_at).toBeTruthy()
      expect(user.updated_at).toBeTruthy()
    })

    it('creates a user without company_id', async () => {
      const user = await userRepo.create({ ...sampleUser, id: 'user-super', company_id: null })

      expect(user.id).toBe('user-super')
      expect(user.company_id).toBeNull()
    })
  })

  describe('findById', () => {
    it('returns user by id', async () => {
      await userRepo.create(sampleUser)

      const found = await userRepo.findById('user-1')

      expect(found).not.toBeNull()
      expect(found?.email).toBe('john@test.com')
    })

    it('returns null for non-existent id', async () => {
      const found = await userRepo.findById('non-existent')

      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      await userRepo.create(sampleUser)

      const found = await userRepo.findByEmail('john@test.com')

      expect(found).not.toBeNull()
      expect(found?.id).toBe('user-1')
    })

    it('returns null for non-existent email', async () => {
      const found = await userRepo.findByEmail('none@test.com')

      expect(found).toBeNull()
    })
  })

  describe('findAllByCompany', () => {
    it('returns users for a company', async () => {
      await userRepo.create(sampleUser)
      await userRepo.create({ ...sampleUser, id: 'user-2', email: 'jane@test.com' })

      const users = await userRepo.findAllByCompany('comp-1')

      expect(users).toHaveLength(2)
    })

    it('returns empty array for company with no users', async () => {
      const users = await userRepo.findAllByCompany('comp-1')

      expect(users).toHaveLength(0)
    })
  })

  describe('updateStatus', () => {
    it('updates user status', async () => {
      await userRepo.create(sampleUser)

      const updated = await userRepo.updateStatus('user-1', 'SUSPENDED')

      expect(updated?.status).toBe('SUSPENDED')
    })

    it('returns null for non-existent id', async () => {
      const updated = await userRepo.updateStatus('non-existent', 'inactive')

      expect(updated).toBeNull()
    })
  })

  describe('existsByEmail', () => {
    it('returns true for existing email', async () => {
      await userRepo.create(sampleUser)

      const exists = await userRepo.existsByEmail('john@test.com')

      expect(exists).toBeTrue()
    })

    it('returns false for non-existent email', async () => {
      const exists = await userRepo.existsByEmail('none@test.com')

      expect(exists).toBeFalse()
    })
  })
})
