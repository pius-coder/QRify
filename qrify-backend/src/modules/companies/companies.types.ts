import type { CompanyData } from '../../database/repositories/contracts/company.repository'

export interface CompanyProfileResponse {
  id: string
  name: string
  companyCode: string
  timezone: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyDTO {
  name: string
  timezone: string
}

export interface CompanyCodeResponse {
  companyCode: string
}

export function toCompanyProfileResponse(company: CompanyData): CompanyProfileResponse {
  return {
    id: company.id,
    name: company.name,
    companyCode: company.company_code,
    timezone: company.timezone,
    status: company.status,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  }
}
