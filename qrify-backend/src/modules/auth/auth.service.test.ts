import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { IdService } from '../../services/id.service'
import { PasswordService } from '../../services/password.service'
import { TokenService } from '../../services/token.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let adapter: SqliteAdapter
  let userRepo: SqliteUserRepository
  let companyRepo: SqliteCompanyRepository
  let authService: AuthService

  beforeEach(() => {
    adapter = createTestDb()
    userRepo = new SqliteUserRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)
    authService = new AuthService(
      adapter,
      userRepo,
      companyRepo,
      new IdService(),
      new PasswordService(),
      new TokenService(),
    )
  })

  describe('registerCompany', () => {
    it('creates company and admin user', async () => {
      const result = await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@test.com',
        adminPassword: 'password123',
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('john@test.com')
      expect(result.user.role).toBe('COMPANY_ADMIN')
      expect(result.user.status).toBe('ACTIVE')
      expect(result.company).toBeDefined()
      expect(result.company.code).toBe('TEST01')

      const company = await companyRepo.findById(result.company.id)
      expect(company).not.toBeNull()
      expect(company!.status).toBe('ACTIVE')
    })

    it('rejects duplicate email', async () => {
      await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@test.com',
        adminPassword: 'password123',
      })

      expect(
        authService.registerCompany({
          companyName: 'Other Corp',
          companyCode: 'TEST02',
          timezone: 'UTC',
          adminFirstName: 'Jane',
          adminLastName: 'Doe',
          adminEmail: 'john@test.com',
          adminPassword: 'password456',
        }),
      ).rejects.toThrow('A user with this email already exists')
    })

    it('rejects duplicate company code', async () => {
      await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@test.com',
        adminPassword: 'password123',
      })

      expect(
        authService.registerCompany({
          companyName: 'Other Corp',
          companyCode: 'TEST01',
          timezone: 'UTC',
          adminFirstName: 'Jane',
          adminLastName: 'Doe',
          adminEmail: 'jane@test.com',
          adminPassword: 'password456',
        }),
      ).rejects.toThrow('This company code is already taken')
    })
  })

  describe('registerEmployee', () => {
    beforeEach(async () => {
      await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
      })
    })

    it('creates employee with PENDING status', async () => {
      const result = await authService.registerEmployee({
        companyCode: 'TEST01',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password456',
      })

      expect(result.user.email).toBe('jane@test.com')
      expect(result.user.role).toBe('EMPLOYEE')
      expect(result.user.status).toBe('PENDING')
    })

    it('rejects if company not found', async () => {
      expect(
        authService.registerEmployee({
          companyCode: 'NONEXIST',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          password: 'password456',
        }),
      ).rejects.toThrow('Company not found')
    })

    it('rejects duplicate email', async () => {
      await authService.registerEmployee({
        companyCode: 'TEST01',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password456',
      })

      expect(
        authService.registerEmployee({
          companyCode: 'TEST01',
          firstName: 'Other',
          lastName: 'User',
          email: 'jane@test.com',
          password: 'password789',
        }),
      ).rejects.toThrow('A user with this email already exists')
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
      })
    })

    it('returns user and token with valid credentials', async () => {
      const result = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('admin@test.com')
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
    })

    it('rejects wrong password', async () => {
      expect(
        authService.login({
          email: 'admin@test.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Invalid email or password')
    })

    it('rejects non-existent email', async () => {
      expect(
        authService.login({
          email: 'none@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email or password')
    })

    it('rejects pending account', async () => {
      await authService.registerEmployee({
        companyCode: 'TEST01',
        firstName: 'Pending',
        lastName: 'User',
        email: 'pending@test.com',
        password: 'password123',
      })

      expect(
        authService.login({
          email: 'pending@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow('pending approval')
    })
  })

  describe('getUser', () => {
    it('returns user by id', async () => {
      const { user: created } = await authService.registerCompany({
        companyName: 'Test Corp',
        companyCode: 'TEST01',
        timezone: 'UTC',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
      })

      const result = await authService.getUser(created.id)
      expect(result.user.id).toBe(created.id)
      expect(result.user.email).toBe('admin@test.com')
      expect((result.user as any).password_hash).toBeUndefined()
    })

    it('throws if user not found', async () => {
      expect(
        authService.getUser('non-existent-id'),
      ).rejects.toThrow()
    })
  })
})
