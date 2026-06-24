import { randomUUID } from 'node:crypto'
import type { DatabaseAdapter } from '../../database.types'
import type { ScanEventData, ScanEventRepository } from '../contracts/scan-event.repository'

export class SqliteScanEventRepository implements ScanEventRepository {
  constructor(private db: DatabaseAdapter) {}

  async create(data: Omit<ScanEventData, 'id' | 'created_at'>): Promise<ScanEventData> {
    const id = randomUUID()
    this.db.run(
      'INSERT INTO scan_events (id, company_id, user_id, qr_session_id, event_type, scanned_at, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.company_id, data.user_id, data.qr_session_id, data.event_type, data.scanned_at, data.result]
    )
    const { rows } = this.db.query<ScanEventData>('SELECT * FROM scan_events WHERE id = ?', [id])
    return rows[0] as ScanEventData
  }

  async findByUserAndDate(userId: string, workDate: string): Promise<ScanEventData[]> {
    const { rows } = this.db.query<ScanEventData>(
      'SELECT * FROM scan_events WHERE user_id = ? AND date(scanned_at) = ? ORDER BY scanned_at',
      [userId, workDate]
    )
    return rows
  }

  async findLastByUserAndType(userId: string, eventType: string, workDate: string): Promise<ScanEventData | null> {
    const { rows } = this.db.query<ScanEventData>(
      'SELECT * FROM scan_events WHERE user_id = ? AND event_type = ? AND date(scanned_at) = ? ORDER BY scanned_at DESC LIMIT 1',
      [userId, eventType, workDate]
    )
    return rows[0] ?? null
  }
}
