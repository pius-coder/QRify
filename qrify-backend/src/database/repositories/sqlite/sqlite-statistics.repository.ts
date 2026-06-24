import type { DatabaseAdapter } from '../../database.types'
import type { StatisticsRepository } from '../contracts/statistics.repository'

export class SqliteStatisticsRepository implements StatisticsRepository {
  constructor(private db: DatabaseAdapter) {}

  async getCompanyStats(companyId: string): Promise<{ total_employees: number; present_today: number; late_today: number; absent_today: number }> {
    const { rows } = this.db.query<{ total_employees: number; present_today: number; late_today: number; absent_today: number }>(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE company_id = ?) as total_employees,
        COALESCE(SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END), 0) as present_today,
        COALESCE(SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END), 0) as late_today,
        COALESCE(SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END), 0) as absent_today
      FROM attendance_records ar
      WHERE ar.company_id = ? AND ar.work_date = date('now')`,
      [companyId, companyId]
    )
    return rows[0] as { total_employees: number; present_today: number; late_today: number; absent_today: number }
  }

  async getEmployeeRankings(companyId: string, startDate: string, endDate: string): Promise<Array<{ user_id: string; first_name: string; last_name: string; total_worked_minutes: number; total_overtime_minutes: number }>> {
    const { rows } = this.db.query<{ user_id: string; first_name: string; last_name: string; total_worked_minutes: number; total_overtime_minutes: number }>(
      `SELECT u.id as user_id, u.first_name, u.last_name,
        COALESCE(SUM(ar.worked_minutes), 0) as total_worked_minutes,
        COALESCE(SUM(ar.overtime_minutes), 0) as total_overtime_minutes
      FROM users u
      LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.work_date BETWEEN ? AND ?
      WHERE u.company_id = ?
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_worked_minutes DESC`,
      [startDate, endDate, companyId]
    )
    return rows
  }

  async getAttendanceRate(companyId: string, startDate: string, endDate: string): Promise<{ overall_rate: number }> {
    const { rows } = this.db.query<{ overall_rate: number }>(
      `SELECT
        CASE WHEN COUNT(*) > 0 THEN
          ROUND(
            CAST(SUM(CASE WHEN ar.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) AS REAL)
            / CAST(COUNT(*) AS REAL) * 100, 2
          )
        ELSE 0
        END as overall_rate
      FROM attendance_records ar
      WHERE ar.company_id = ? AND ar.work_date BETWEEN ? AND ?`,
      [companyId, startDate, endDate]
    )
    return rows[0] as { overall_rate: number }
  }
}
