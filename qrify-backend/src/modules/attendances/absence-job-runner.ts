import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { AttendanceService } from './attendances.service'

export class AbsenceJobRunner {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastRunDate: Map<string, string> = new Map()

  constructor(
    private attendanceService: AttendanceService,
    private companyRepo: CompanyRepository,
    private interval: number,
  ) {}

  start(): void {
    if (this.intervalId) return
    this.runOnce()
    this.intervalId = setInterval(() => this.runOnce(), this.interval)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async runOnce(): Promise<number> {
    const companies = await this.companyRepo.findAll()
    const activeCompanies = companies.filter((c) => c.status === 'ACTIVE')
    let total = 0

    for (const company of activeCompanies) {
      const dayOver = await this.attendanceService.isDayOver(company.id)
      if (!dayOver) continue

      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: company.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const today = formatter.format(now)

      if (this.lastRunDate.get(company.id) === today) continue

      const count = await this.attendanceService.detectAbsencesForCompany(company.id, today)
      if (count > 0) total += count
      this.lastRunDate.set(company.id, today)
    }

    return total
  }
}
