import type { CompanyData } from '../../database/repositories/contracts/company.repository'

export interface CompanyListResponse {
  id: string
  name: string
  companyCode: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CompanyDetailResponse extends CompanyListResponse {
  timezone: string
}

export interface UpdateCompanyStatusDTO {
  status: 'ACTIVE' | 'SUSPENDED'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SuperAdminStatisticsResponse {
  totalCompanies: number
  activeCompanies: number
  suspendedCompanies: number
  totalEmployees: number
  todayScans: number
  periodAttendance: number
}

export function toCompanyListResponse(company: CompanyData): CompanyListResponse {
  return {
    id: company.id,
    name: company.name,
    companyCode: company.company_code,
    status: company.status,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
  }
}

export function toCompanyDetailResponse(company: CompanyData): CompanyDetailResponse {
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
