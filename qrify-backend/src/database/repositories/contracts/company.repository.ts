export interface CompanyData {
  id: string
  name: string
  company_code: string
  timezone: string
  status: string
  created_at: string
  updated_at: string
}

export interface CompanySearchParams {
  search?: string
  status?: string
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  rows: T[]
  total: number
}

export interface CompanyRepository {
  findById(id: string): Promise<CompanyData | null>
  findByCode(code: string): Promise<CompanyData | null>
  findAll(): Promise<CompanyData[]>
  searchCompanies(params: CompanySearchParams): Promise<PaginatedResult<CompanyData>>
  create(data: Omit<CompanyData, 'created_at' | 'updated_at'>): Promise<CompanyData>
  update(id: string, data: Partial<CompanyData>): Promise<CompanyData | null>
  existsByCode(code: string): Promise<boolean>
}
