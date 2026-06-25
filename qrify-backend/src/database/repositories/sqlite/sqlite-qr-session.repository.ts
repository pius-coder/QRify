import { randomUUID } from 'node:crypto'
import type { DatabaseAdapter } from '../../database.types'
import type { QrSessionData, QrSessionRepository } from '../contracts/qr-session.repository'

export class SqliteQrSessionRepository implements QrSessionRepository {
  constructor(private db: DatabaseAdapter) {}

  async findActiveByCompanyAndType(companyId: string, eventType: string, workDate: string): Promise<QrSessionData | null> {
    const { rows } = this.db.query<QrSessionData>(
      "SELECT * FROM qr_sessions WHERE company_id = ? AND event_type = ? AND work_date = ? AND status = 'ACTIVE' AND valid_until > datetime('now')",
      [companyId, eventType, workDate]
    )
    return rows[0] ?? null
  }

  async findByTokenHash(tokenHash: string): Promise<QrSessionData | null> {
    const { rows } = this.db.query<QrSessionData>('SELECT * FROM qr_sessions WHERE token_hash = ?', [tokenHash])
    return rows[0] ?? null
  }

  async create(data: Omit<QrSessionData, 'id' | 'created_at'>): Promise<QrSessionData> {
    const existing = this.db.query<{ id: string }>(
      'SELECT id FROM qr_sessions WHERE company_id = ? AND work_date = ? AND event_type = ?',
      [data.company_id, data.work_date, data.event_type],
    ).rows[0]

    const id = existing?.id ?? randomUUID()
    this.db.run(
      `INSERT INTO qr_sessions (id, company_id, work_date, event_type, token_hash, valid_from, valid_until, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(company_id, work_date, event_type) DO UPDATE SET
         token_hash = excluded.token_hash,
         valid_from = excluded.valid_from,
         valid_until = excluded.valid_until,
         status = excluded.status`,
      [id, data.company_id, data.work_date, data.event_type, data.token_hash, data.valid_from, data.valid_until, data.status]
    )
    const { rows } = this.db.query<QrSessionData>('SELECT * FROM qr_sessions WHERE id = ?', [id])
    return rows[0] as QrSessionData
  }

  async expireById(id: string): Promise<void> {
    this.db.run("UPDATE qr_sessions SET status = 'EXPIRED' WHERE id = ?", [id])
  }

  async revokeByCompanyAndDate(companyId: string, workDate: string): Promise<void> {
    this.db.run("UPDATE qr_sessions SET status = 'REVOKED' WHERE company_id = ? AND work_date = ?", [companyId, workDate])
  }
}
