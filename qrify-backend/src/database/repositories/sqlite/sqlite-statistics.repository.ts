import type { DatabaseAdapter } from '../../database.types'
import type { LastScanEntry, DailyChartEntry, PeriodStats, RankingEntry, WeeklyReportRow } from '../contracts/statistics.repository'
import type { StatisticsRepository } from '../contracts/statistics.repository'

export class SqliteStatisticsRepository implements StatisticsRepository {
  constructor(private db: DatabaseAdapter) {}

  async getCompanyStats(companyId: string): Promise<{ total_employees: number; present_today: number; late_today: number; absent_today: number }> {
    const { rows } = this.db.query<{ total_employees: number; present_today: number; late_today: number; absent_today: number }>(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'EMPLOYEE' AND status = 'ACTIVE') as total_employees,
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

  async getIncompletePresences(companyId: string): Promise<number> {
    const { rows } = this.db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM attendance_records
       WHERE company_id = ? AND work_date = date('now')
       AND arrival_at IS NOT NULL AND departure_at IS NULL`,
      [companyId]
    )
    return (rows[0] as { count: number }).count
  }

  async getLastAcceptedScans(companyId: string, limit: number): Promise<LastScanEntry[]> {
    const { rows } = this.db.query<LastScanEntry>(
      `SELECT se.user_id as userId, u.first_name as firstName, u.last_name as lastName,
              se.event_type as eventType, se.scanned_at as scannedAt
       FROM scan_events se
       JOIN users u ON u.id = se.user_id
       WHERE se.company_id = ? AND se.result = 'ACCEPTED'
       ORDER BY se.scanned_at DESC
       LIMIT ?`,
      [companyId, limit]
    )
    return rows
  }

  async getPeriodStats(companyId: string, startDate: string, endDate: string): Promise<PeriodStats> {
    const { rows } = this.db.query<PeriodStats>(
      `SELECT
        COALESCE(SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END), 0) as lateCount,
        COALESCE(SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END), 0) as absenceCount,
        COALESCE(SUM(ar.overtime_minutes), 0) as overtimeTotal
      FROM attendance_records ar
      WHERE ar.company_id = ? AND ar.work_date BETWEEN ? AND ?`,
      [companyId, startDate, endDate]
    )
    return rows[0] as PeriodStats
  }

  async getDailyChart(companyId: string, startDate: string, endDate: string): Promise<DailyChartEntry[]> {
    const { rows } = this.db.query<DailyChartEntry>(
      `SELECT ar.work_date as workDate,
        COALESCE(SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END), 0) as present,
        COALESCE(SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END), 0) as late,
        COALESCE(SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END), 0) as absent
      FROM attendance_records ar
      WHERE ar.company_id = ? AND ar.work_date BETWEEN ? AND ?
      GROUP BY ar.work_date
      ORDER BY ar.work_date ASC`,
      [companyId, startDate, endDate]
    )
    return rows
  }

  async getRankingsByAssiduity(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]> {
    const { rows } = this.db.query<RankingEntry>(
      `SELECT u.id as userId, u.first_name as firstName, u.last_name as lastName,
        ROUND(
          CAST(SUM(CASE WHEN ar.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) AS REAL)
          / CAST(COUNT(ar.id) AS REAL) * 100, 2
        ) as value
      FROM users u
      JOIN attendance_records ar ON ar.user_id = u.id AND ar.work_date BETWEEN ? AND ?
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      GROUP BY u.id, u.first_name, u.last_name
      HAVING COUNT(ar.id) > 0
      ORDER BY value DESC`,
      [startDate, endDate, companyId]
    )
    return rows
  }

  async getRankingsByLate(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]> {
    const { rows } = this.db.query<RankingEntry>(
      `SELECT u.id as userId, u.first_name as firstName, u.last_name as lastName,
        COALESCE(SUM(ar.late_minutes), 0) as value
      FROM users u
      LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.work_date BETWEEN ? AND ?
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      GROUP BY u.id, u.first_name, u.last_name
      HAVING value > 0
      ORDER BY value DESC`,
      [startDate, endDate, companyId]
    )
    return rows
  }

  async getRankingsByAbsence(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]> {
    const { rows } = this.db.query<RankingEntry>(
      `SELECT u.id as userId, u.first_name as firstName, u.last_name as lastName,
        COALESCE(SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END), 0) as value
      FROM users u
      LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.work_date BETWEEN ? AND ?
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      GROUP BY u.id, u.first_name, u.last_name
      HAVING value > 0
      ORDER BY value DESC`,
      [startDate, endDate, companyId]
    )
    return rows
  }

  async getWeeklyReport(companyId: string, year: number, week: number): Promise<WeeklyReportRow[]> {
    const { rows } = this.db.query<WeeklyReportRow>(
      `SELECT u.id as userId, u.first_name as firstName, u.last_name as lastName,
        COALESCE(SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END), 0) as daysPresent,
        COALESCE(SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END), 0) as daysLate,
        COALESCE(SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END), 0) as daysAbsent,
        COALESCE(SUM(ar.late_minutes), 0) as lateMinutes,
        COALESCE(SUM(ar.worked_minutes), 0) as workedMinutes,
        COALESCE(SUM(ar.overtime_minutes), 0) as overtimeMinutes
      FROM users u
      LEFT JOIN attendance_records ar ON ar.user_id = u.id
        AND CAST(strftime('%Y', ar.work_date) AS INTEGER) = ?
        AND CAST(strftime('%W', ar.work_date) AS INTEGER) = ?
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY u.last_name ASC, u.first_name ASC`,
      [year, week, companyId]
    )
    return rows
  }
}
