import { randomUUID } from 'node:crypto'
import type { DatabaseAdapter } from '../../database.types'
import type { WorkScheduleData, WorkScheduleDayData, ScheduleRepository } from '../contracts/schedule.repository'

export class SqliteScheduleRepository implements ScheduleRepository {
  constructor(private db: DatabaseAdapter) {}

  async findByCompanyId(companyId: string): Promise<WorkScheduleData | null> {
    const { rows } = this.db.query<WorkScheduleData>('SELECT * FROM work_schedules WHERE company_id = ?', [companyId])
    return rows[0] ?? null
  }

  async upsert(companyId: string, data: Omit<WorkScheduleData, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<WorkScheduleData> {
    const existing = await this.findByCompanyId(companyId)
    const id = existing?.id ?? randomUUID()

    this.db.run(
      `INSERT INTO work_schedules (id, company_id, start_time, break_start_time, break_end_time, end_time, late_tolerance_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         start_time = COALESCE(?, start_time),
         break_start_time = COALESCE(?, break_start_time),
         break_end_time = COALESCE(?, break_end_time),
         end_time = COALESCE(?, end_time),
         late_tolerance_minutes = COALESCE(?, late_tolerance_minutes),
         updated_at = datetime('now')`,
      [
        id, companyId, data.start_time, data.break_start_time, data.break_end_time, data.end_time, data.late_tolerance_minutes,
        data.start_time, data.break_start_time, data.break_end_time, data.end_time, data.late_tolerance_minutes,
      ]
    )

    const { rows } = this.db.query<WorkScheduleData>('SELECT * FROM work_schedules WHERE id = ?', [id])
    return rows[0] as WorkScheduleData
  }

  async findDaysByScheduleId(scheduleId: string): Promise<WorkScheduleDayData[]> {
    const { rows } = this.db.query<WorkScheduleDayData>('SELECT * FROM work_schedule_days WHERE schedule_id = ?', [scheduleId])
    return rows
  }

  async upsertDays(scheduleId: string, weekdays: number[]): Promise<WorkScheduleDayData[]> {
    this.db.transaction(() => {
      this.db.run('DELETE FROM work_schedule_days WHERE schedule_id = ?', [scheduleId])

      for (const weekday of weekdays) {
        this.db.run(
          'INSERT INTO work_schedule_days (id, schedule_id, weekday) VALUES (?, ?, ?)',
          [randomUUID(), scheduleId, weekday]
        )
      }
    })

    return this.findDaysByScheduleId(scheduleId)
  }
}
