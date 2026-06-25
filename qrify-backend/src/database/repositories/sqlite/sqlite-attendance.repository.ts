import { randomUUID } from 'node:crypto'
import type { DatabaseAdapter } from '../../database.types'
import type { AttendanceData, AttendanceRepository } from '../contracts/attendance.repository'

export class SqliteAttendanceRepository implements AttendanceRepository {
  constructor(private db: DatabaseAdapter) {}

  async findById(id: string): Promise<AttendanceData | null> {
    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async findByUserAndDate(userId: string, workDate: string): Promise<AttendanceData | null> {
    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE user_id = ? AND work_date = ?', [userId, workDate])
    return rows[0] ?? null
  }

  async create(data: Omit<AttendanceData, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceData> {
    const id = randomUUID()
    this.db.run(
      'INSERT INTO attendance_records (id, company_id, user_id, work_date, arrival_at, break_start_at, break_end_at, departure_at, status, late_minutes, break_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.company_id, data.user_id, data.work_date, data.arrival_at, data.break_start_at, data.break_end_at, data.departure_at, data.status, data.late_minutes, data.break_minutes, data.worked_minutes, data.overtime_minutes]
    )
    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE id = ?', [id])
    return rows[0] as AttendanceData
  }

  async update(id: string, data: Partial<AttendanceData>): Promise<AttendanceData | null> {
    this.db.run(
      `UPDATE attendance_records SET
        status = COALESCE(?, status),
        arrival_at = COALESCE(?, arrival_at),
        break_start_at = COALESCE(?, break_start_at),
        break_end_at = COALESCE(?, break_end_at),
        departure_at = COALESCE(?, departure_at),
        late_minutes = COALESCE(?, late_minutes),
        break_minutes = COALESCE(?, break_minutes),
        worked_minutes = COALESCE(?, worked_minutes),
        overtime_minutes = COALESCE(?, overtime_minutes),
        updated_at = datetime('now')
      WHERE id = ?`,
      [data.status ?? null, data.arrival_at ?? null, data.break_start_at ?? null, data.break_end_at ?? null, data.departure_at ?? null, data.late_minutes ?? null, data.break_minutes ?? null, data.worked_minutes ?? null, data.overtime_minutes ?? null, id]
    )

    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE id = ?', [id])
    return rows[0] ?? null
  }

  async findByCompanyAndDate(companyId: string, workDate: string): Promise<AttendanceData[]> {
    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE company_id = ? AND work_date = ? ORDER BY user_id', [companyId, workDate])
    return rows
  }

  async findAllByUser(userId: string): Promise<AttendanceData[]> {
    const { rows } = this.db.query<AttendanceData>('SELECT * FROM attendance_records WHERE user_id = ? ORDER BY work_date DESC', [userId])
    return rows
  }
}
