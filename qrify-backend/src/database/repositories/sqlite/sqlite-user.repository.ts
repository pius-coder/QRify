import type { DatabaseAdapter } from '../../database.types'
import type { UserData, UserRepository } from '../contracts/user.repository'

export class SqliteUserRepository implements UserRepository {
  constructor(private db: DatabaseAdapter) {}

  async findById(id: string): Promise<UserData | null> {
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async findByEmail(email: string): Promise<UserData | null> {
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE email = ?', [email])
    return rows[0] ?? null
  }

  async findAllByCompany(companyId: string): Promise<UserData[]> {
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE company_id = ? ORDER BY created_at DESC', [companyId])
    return rows
  }

  async create(data: Omit<UserData, 'created_at' | 'updated_at'>): Promise<UserData> {
    this.db.run(
      'INSERT INTO users (id, company_id, first_name, last_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.company_id, data.first_name, data.last_name, data.email, data.password_hash, data.role, data.status]
    )
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE id = ?', [data.id])
    return rows[0] as UserData
  }

  async update(id: string, data: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>): Promise<UserData | null> {
    this.db.run(
      "UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), password_hash = COALESCE(?, password_hash), role = COALESCE(?, role), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?",
      [data.first_name ?? null, data.last_name ?? null, data.email ?? null, data.password_hash ?? null, data.role ?? null, data.status ?? null, id]
    )
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async updateStatus(id: string, status: string): Promise<UserData | null> {
    this.db.run("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id])
    const { rows } = this.db.query<UserData>('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { rows } = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE email = ?', [email])
    return (rows[0] as { count: number }).count > 0
  }
}
