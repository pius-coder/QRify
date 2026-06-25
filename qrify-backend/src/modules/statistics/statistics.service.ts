import type { StatisticsRepository } from '../../database/repositories/contracts/statistics.repository'
import type { QrSessionRepository } from '../../database/repositories/contracts/qr-session.repository'
import type { DashboardResponse, PeriodStatsResponse, RankingsResponse, WeeklyReportResponse } from './statistics.types'
import { InvalidPeriodError, InvalidRankingTypeError, InvalidWeekError, CompanyNotActiveForStatsError } from './statistics.errors'

export class StatisticsService {
  constructor(
    private statsRepo: StatisticsRepository,
    private qrSessionRepo: QrSessionRepository,
  ) {}

  async getDashboard(companyId: string): Promise<DashboardResponse> {
    const companyStats = await this.statsRepo.getCompanyStats(companyId)
    const incompletePresences = await this.statsRepo.getIncompletePresences(companyId)
    const activeQrCount = await this.qrSessionRepo.countActiveByCompany(companyId)
    const lastScans = await this.statsRepo.getLastAcceptedScans(companyId, 10)

    return {
      activeEmployees: companyStats.total_employees,
      presentToday: companyStats.present_today,
      lateToday: companyStats.late_today,
      absentToday: companyStats.absent_today,
      incompletePresences,
      activeQr: activeQrCount > 0,
      lastScans: lastScans.map(s => ({
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        eventType: s.eventType,
        scannedAt: s.scannedAt,
      })),
    }
  }

  async getAttendance(companyId: string, startDate: string, endDate: string): Promise<PeriodStatsResponse> {
    if (startDate > endDate) {
      throw new InvalidPeriodError()
    }

    const [attendanceRate, periodStats, dailyChart] = await Promise.all([
      this.statsRepo.getAttendanceRate(companyId, startDate, endDate),
      this.statsRepo.getPeriodStats(companyId, startDate, endDate),
      this.statsRepo.getDailyChart(companyId, startDate, endDate),
    ])

    return {
      attendanceRate: attendanceRate.overall_rate,
      lateCount: periodStats.lateCount,
      absenceCount: periodStats.absenceCount,
      overtimeTotal: periodStats.overtimeTotal,
      dailyChart,
    }
  }

  async getRankings(companyId: string, type: string, startDate: string, endDate: string): Promise<RankingsResponse> {
    if (startDate > endDate) {
      throw new InvalidPeriodError()
    }

    let rankings

    switch (type) {
      case 'assiduity':
        rankings = await this.statsRepo.getRankingsByAssiduity(companyId, startDate, endDate)
        break
      case 'late':
        rankings = await this.statsRepo.getRankingsByLate(companyId, startDate, endDate)
        break
      case 'absence':
        rankings = await this.statsRepo.getRankingsByAbsence(companyId, startDate, endDate)
        break
      default:
        throw new InvalidRankingTypeError(type)
    }

    return {
      type,
      startDate,
      endDate,
      rankings,
    }
  }

  async getWeeklyReport(companyId: string, year: number, week: number): Promise<WeeklyReportResponse> {
    if (week < 1 || week > 53) {
      throw new InvalidWeekError()
    }

    const entries = await this.statsRepo.getWeeklyReport(companyId, year, week)

    return {
      year,
      week,
      entries,
    }
  }
}
