import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { CompanyProfileResponse, UpdateCompanyDTO, CompanyCodeResponse } from './companies.types'
import { toCompanyProfileResponse } from './companies.types'
import { CompanySuspendedError, CompanyProfileNotFoundError } from './companies.errors'

export class CompaniesService {
  constructor(
    private companyRepo: CompanyRepository,
  ) {}

  async getProfile(companyId: string): Promise<CompanyProfileResponse> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) throw new CompanyProfileNotFoundError()
    return toCompanyProfileResponse(company)
  }

  async updateProfile(companyId: string, dto: UpdateCompanyDTO): Promise<CompanyProfileResponse> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) throw new CompanyProfileNotFoundError()
    if (company.status === 'SUSPENDED') throw new CompanySuspendedError()

    const updated = await this.companyRepo.update(companyId, {
      name: dto.name,
      timezone: dto.timezone,
    })

    if (!updated) throw new CompanyProfileNotFoundError()
    return toCompanyProfileResponse(updated)
  }

  async getCompanyCode(companyId: string): Promise<CompanyCodeResponse> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) throw new CompanyProfileNotFoundError()
    return { companyCode: company.company_code }
  }
}
