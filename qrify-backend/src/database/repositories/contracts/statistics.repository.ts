export interface StatisticsRepository {
  getCompanyStats(companyId: string): Promise<{ total_employees: number; present_today: number; late_today: number; absent_today: number }>
  getEmployeeRankings(companyId: string, startDate: string, endDate: string): Promise<Array<{ user_id: string; first_name: string; last_name: string; total_worked_minutes: number; total_overtime_minutes: number }>>
  getAttendanceRate(companyId: string, startDate: string, endDate: string): Promise<{ overall_rate: number }>
}
