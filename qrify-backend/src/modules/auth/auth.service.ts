import type { DatabaseAdapter } from '../../database/database.types'
import type { UserRepository, UserData } from '../../database/repositories/contracts/user.repository'
import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { IdService } from '../../services/id.service'
import type { PasswordService } from '../../services/password.service'
import type { TokenService } from '../../services/token.service'
import type { JwtPayload, RegisterCompanyDTO, RegisterEmployeeDTO, LoginDTO, UserResponse } from './auth.types'
import {
  EmailAlreadyExistsError,
  CompanyCodeAlreadyExistsError,
  InvalidCredentialsError,
  AccountPendingError,
  AccountRejectedError,
  AccountSuspendedError,
  CompanyNotFoundError,
  CompanySuspendedError,
} from './auth.errors'

function toUserResponse(user: UserData): UserResponse {
  return {
    id: user.id,
    companyId: user.company_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
  }
}

export class AuthService {
  constructor(
    private db: DatabaseAdapter,
    private userRepo: UserRepository,
    private companyRepo: CompanyRepository,
    private idService: IdService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
  ) {}

  async registerCompany(dto: RegisterCompanyDTO) {
    const emailExists = await this.userRepo.existsByEmail(dto.adminEmail)
    if (emailExists) throw new EmailAlreadyExistsError()

    const codeExists = await this.companyRepo.existsByCode(dto.companyCode)
    if (codeExists) throw new CompanyCodeAlreadyExistsError()

    const passwordHash = await this.passwordService.hash(dto.adminPassword)
    const companyId = this.idService.generate()
    const userId = this.idService.generate()

    this.db.transaction(() => {
      this.db.run(
        'INSERT INTO companies (id, name, company_code, timezone, status) VALUES (?, ?, ?, ?, ?)',
        [companyId, dto.companyName, dto.companyCode, dto.timezone, 'ACTIVE'],
      )
      this.db.run(
        'INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, companyId, dto.adminFirstName, dto.adminLastName, dto.adminEmail, passwordHash, 'COMPANY_ADMIN', 'ACTIVE'],
      )
    })

    const company = await this.companyRepo.findById(companyId)
    const user = await this.userRepo.findById(userId)

    if (!user || !company) throw new Error('Failed to create company and user')

    return {
      user: toUserResponse(user),
      company: { id: company.id, name: company.name, code: company.company_code },
    }
  }

  async registerEmployee(dto: RegisterEmployeeDTO) {
    const company = await this.companyRepo.findByCode(dto.companyCode)
    if (!company) throw new CompanyNotFoundError()
    if (company.status === 'SUSPENDED') throw new CompanySuspendedError()

    const emailExists = await this.userRepo.existsByEmail(dto.email)
    if (emailExists) throw new EmailAlreadyExistsError()

    const passwordHash = await this.passwordService.hash(dto.password)
    const userId = this.idService.generate()

    const user = await this.userRepo.create({
      id: userId,
      company_id: company.id,
      first_name: dto.firstName,
      last_name: dto.lastName,
      email: dto.email,
      password_hash: passwordHash,
      role: 'EMPLOYEE',
      status: 'PENDING',
    })

    return { user: toUserResponse(user), company: { id: company.id, name: company.name, code: company.company_code } }
  }

  async login(dto: LoginDTO) {
    const user = await this.userRepo.findByEmail(dto.email)
    if (!user) throw new InvalidCredentialsError()

    const valid = await this.passwordService.verify(dto.password, user.password_hash)
    if (!valid) throw new InvalidCredentialsError()

    if (user.status === 'PENDING') throw new AccountPendingError()
    if (user.status === 'REJECTED') throw new AccountRejectedError()
    if (user.status === 'SUSPENDED') throw new AccountSuspendedError()

    if (user.company_id) {
      const company = await this.companyRepo.findById(user.company_id)
      if (company && company.status === 'SUSPENDED') throw new CompanySuspendedError()
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      companyId: user.company_id,
      status: user.status,
    }

    const token = await this.tokenService.createToken(payload)

    return { user: toUserResponse(user), token }
  }

  async getUser(userId: string) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new InvalidCredentialsError()

    return { user: toUserResponse(user) }
  }
}
