export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  incompletePresences: number
}

export interface LastScanEntry {
  userId: string
  firstName: string
  lastName: string
  eventType: string
  scannedAt: string
}

export interface DailyChartEntry {
  workDate: string
  present: number
  late: number
  absent: number
}

export interface PeriodStats {
  lateCount: number
  absenceCount: number
  overtimeTotal: number
}

export interface RankingEntry {
  userId: string
  firstName: string
  lastName: string
  value: number
}

export interface WeeklyReportRow {
  userId: string
  firstName: string
  lastName: string
  daysPresent: number
  daysLate: number
  daysAbsent: number
  lateMinutes: number
  workedMinutes: number
  overtimeMinutes: number
}

export interface StatisticsRepository {
  getCompanyStats(companyId: string): Promise<{ total_employees: number; present_today: number; late_today: number; absent_today: number }>
  getEmployeeRankings(companyId: string, startDate: string, endDate: string): Promise<Array<{ user_id: string; first_name: string; last_name: string; total_worked_minutes: number; total_overtime_minutes: number }>>
  getAttendanceRate(companyId: string, startDate: string, endDate: string): Promise<{ overall_rate: number }>

  getIncompletePresences(companyId: string): Promise<number>
  getLastAcceptedScans(companyId: string, limit: number): Promise<LastScanEntry[]>
  getPeriodStats(companyId: string, startDate: string, endDate: string): Promise<PeriodStats>
  getDailyChart(companyId: string, startDate: string, endDate: string): Promise<DailyChartEntry[]>
  getRankingsByAssiduity(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]>
  getRankingsByLate(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]>
  getRankingsByAbsence(companyId: string, startDate: string, endDate: string): Promise<RankingEntry[]>
  getWeeklyReport(companyId: string, year: number, week: number): Promise<WeeklyReportRow[]>
}
