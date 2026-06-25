import { ConflictError } from '../../utils/errors'
import type { UserRepository } from '../../database/repositories/contracts/user.repository'
import type { EmployeeResponse, UpdateEmployeeDTO, UpdateEmployeeStatusDTO } from './employees.types'
import { toEmployeeResponse } from './employees.types'
import { EmployeeNotFoundError, EmployeeNotInCompanyError, CannotModifyCompanyAdminError, InvalidStatusTransitionError } from './employees.errors'
import { validateStatusTransition } from './employees.schema'

export class EmployeeService {
  constructor(
    private userRepo: UserRepository,
  ) {}

  async list(companyId: string): Promise<EmployeeResponse[]> {
    const users = await this.userRepo.findAllByCompany(companyId)
    return users
      .filter((u) => u.role === 'EMPLOYEE')
      .map(toEmployeeResponse)
  }

  async getById(companyId: string, employeeId: string): Promise<EmployeeResponse> {
    const user = await this.userRepo.findById(employeeId)
    if (!user) throw new EmployeeNotFoundError()
    if (user.company_id !== companyId) throw new EmployeeNotInCompanyError()
    return toEmployeeResponse(user)
  }

  async update(companyId: string, employeeId: string, dto: UpdateEmployeeDTO): Promise<EmployeeResponse> {
    const user = await this.userRepo.findById(employeeId)
    if (!user) throw new EmployeeNotFoundError()
    if (user.company_id !== companyId) throw new EmployeeNotInCompanyError()
    if (user.role !== 'EMPLOYEE') throw new CannotModifyCompanyAdminError()

    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.userRepo.existsByEmail(dto.email)
      if (emailTaken) throw new ConflictError('A user with this email already exists')
    }

    const updated = await this.userRepo.update(employeeId, {
      first_name: dto.firstName,
      last_name: dto.lastName,
      email: dto.email,
    })

    if (!updated) throw new EmployeeNotFoundError()
    return toEmployeeResponse(updated)
  }

  async updateStatus(companyId: string, employeeId: string, dto: UpdateEmployeeStatusDTO): Promise<EmployeeResponse> {
    const user = await this.userRepo.findById(employeeId)
    if (!user) throw new EmployeeNotFoundError()
    if (user.company_id !== companyId) throw new EmployeeNotInCompanyError()
    if (user.role !== 'EMPLOYEE') throw new CannotModifyCompanyAdminError()

    if (!validateStatusTransition(user.status, dto.status)) {
      throw new InvalidStatusTransitionError(`Cannot transition from ${user.status} to ${dto.status}`)
    }

    const updated = await this.userRepo.updateStatus(employeeId, dto.status)
    if (!updated) throw new EmployeeNotFoundError()
    return toEmployeeResponse(updated)
  }
}
