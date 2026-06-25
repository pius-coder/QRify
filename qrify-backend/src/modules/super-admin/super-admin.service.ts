import type { DatabaseAdapter } from '../../database/database.types'
import type { CompanyRepository, CompanySearchParams } from '../../database/repositories/contracts/company.repository'
import type { CompanyListResponse, CompanyDetailResponse, UpdateCompanyStatusDTO, PaginationMeta, SuperAdminStatisticsResponse } from './super-admin.types'
import { toCompanyListResponse, toCompanyDetailResponse } from './super-admin.types'
import { SuperAdminCompanyNotFoundError, InvalidCompanyStatusTransitionError } from './super-admin.errors'

const VALID_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
}

export class SuperAdminService {
  constructor(
    private companyRepo: CompanyRepository,
    private db: DatabaseAdapter,
  ) {}

  async listCompanies(params: CompanySearchParams): Promise<{ companies: CompanyListResponse[]; meta: PaginationMeta }> {
    const { rows, total } = await this.companyRepo.searchCompanies(params)
    const companies = rows.map(toCompanyListResponse)

    return {
      companies,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    }
  }

  async getCompany(id: string): Promise<CompanyDetailResponse> {
    const company = await this.companyRepo.findById(id)
    if (!company) throw new SuperAdminCompanyNotFoundError()
    return toCompanyDetailResponse(company)
  }

  async updateCompanyStatus(id: string, dto: UpdateCompanyStatusDTO): Promise<CompanyDetailResponse> {
    const company = await this.companyRepo.findById(id)
    if (!company) throw new SuperAdminCompanyNotFoundError()

    const allowed = VALID_TRANSITIONS[company.status]
    if (!allowed || !allowed.includes(dto.status)) {
      throw new InvalidCompanyStatusTransitionError(company.status, dto.status)
    }

    if (company.status === dto.status) {
      return toCompanyDetailResponse(company)
    }

    const updated = await this.companyRepo.update(id, { status: dto.status })
    if (!updated) throw new SuperAdminCompanyNotFoundError()
    return toCompanyDetailResponse(updated)
  }

  async getStatistics(): Promise<SuperAdminStatisticsResponse> {
    const totalCompanies = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM companies')
    const activeCompanies = this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM companies WHERE status = 'ACTIVE'")
    const suspendedCompanies = this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM companies WHERE status = 'SUSPENDED'")
    const totalEmployees = this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'EMPLOYEE'")
    const todayScans = this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM scan_events WHERE date(scanned_at) = date('now')")
    const periodAttendance = this.db.query<{ count: number }>("SELECT COUNT(*) as count FROM attendance_records WHERE work_date >= date('now', '-30 days')")

    return {
      totalCompanies: (totalCompanies.rows[0] as { count: number }).count,
      activeCompanies: (activeCompanies.rows[0] as { count: number }).count,
      suspendedCompanies: (suspendedCompanies.rows[0] as { count: number }).count,
      totalEmployees: (totalEmployees.rows[0] as { count: number }).count,
      todayScans: (todayScans.rows[0] as { count: number }).count,
      periodAttendance: (periodAttendance.rows[0] as { count: number }).count,
    }
  }
}
