import type { DatabaseAdapter } from '../../database.types'
import type { CompanyData, CompanyRepository } from '../contracts/company.repository'

export class SqliteCompanyRepository implements CompanyRepository {
  constructor(private db: DatabaseAdapter) {}

  async findById(id: string): Promise<CompanyData | null> {
    const { rows } = this.db.query<CompanyData>('SELECT * FROM companies WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async findByCode(code: string): Promise<CompanyData | null> {
    const { rows } = this.db.query<CompanyData>('SELECT * FROM companies WHERE company_code = ?', [code])
    return rows[0] ?? null
  }

  async findAll(): Promise<CompanyData[]> {
    const { rows } = this.db.query<CompanyData>('SELECT * FROM companies ORDER BY name')
    return rows
  }

  async create(data: Omit<CompanyData, 'created_at' | 'updated_at'>): Promise<CompanyData> {
    this.db.run(
      'INSERT INTO companies (id, name, company_code, timezone, status) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.name, data.company_code, data.timezone, data.status]
    )
    const { rows } = this.db.query<CompanyData>('SELECT * FROM companies WHERE id = ?', [data.id])
    return rows[0]!
  }

  async update(id: string, data: Partial<CompanyData>): Promise<CompanyData | null> {
    this.db.run(
      "UPDATE companies SET name = COALESCE(?, name), timezone = COALESCE(?, timezone), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?",
      [data.name ?? null, data.timezone ?? null, data.status ?? null, id]
    )
    const { rows } = this.db.query<CompanyData>('SELECT * FROM companies WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async existsByCode(code: string): Promise<boolean> {
    const { rows } = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM companies WHERE company_code = ?', [code])
    return (rows[0] as { count: number }).count > 0
  }
}
