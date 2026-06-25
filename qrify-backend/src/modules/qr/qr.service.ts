import { randomBytes, createHash } from 'node:crypto'
import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { ScheduleRepository, WorkScheduleData } from '../../database/repositories/contracts/schedule.repository'
import type { QrSessionRepository } from '../../database/repositories/contracts/qr-session.repository'
import { QR_CONFIG } from '../../config/qr.config'
import { ClockService } from '../../services/clock.service'
import type { ActiveQrResponse } from './qr.types'
import { toActiveQrResponse } from './qr.types'
import {
  CompanyNotActiveError,
  NoScheduleError,
  NotWorkingDayError,
  NoActiveQrError,
  CompanyCodeNotFoundError,
} from './qr.errors'

export class QrSessionService {
  constructor(
    private companyRepo: CompanyRepository,
    private scheduleRepo: ScheduleRepository,
    private qrSessionRepo: QrSessionRepository,
    private clockService: ClockService,
  ) {}

  async getOrCreateActiveSession(companyId: string): Promise<ActiveQrResponse> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) throw new CompanyCodeNotFoundError()
    if (company.status !== 'ACTIVE') throw new CompanyNotActiveError()

    const schedule = await this.scheduleRepo.findByCompanyId(companyId)
    if (!schedule) throw new NoScheduleError()

    const workDate = this.determineWorkDate(company.timezone)
    const dayOfWeek = this.getDayOfWeek(company.timezone)
    const days = await this.scheduleRepo.findDaysByScheduleId(schedule.id)
    const workingDayNumbers = days.map((d) => d.weekday)
    if (!workingDayNumbers.includes(dayOfWeek)) throw new NotWorkingDayError()

    const localTime = this.getLocalTimeString(company.timezone)
    const eventType = this.determineActiveEventType(schedule, localTime)
    if (!eventType) throw new NoActiveQrError()

    const { raw, hash } = this.generateToken()
    const now = this.clockService.now()
    const validFrom = now.toISOString()
    const validUntil = new Date(now.getTime() + this.getWindowDuration(eventType) * 60 * 1000).toISOString()

    const session = await this.qrSessionRepo.create({
      company_id: companyId,
      work_date: workDate,
      event_type: eventType,
      token_hash: hash,
      valid_from: validFrom,
      valid_until: validUntil,
      status: 'ACTIVE',
    })

    return toActiveQrResponse(session, raw)
  }

  async getActiveQrByCompanyCode(companyCode: string): Promise<ActiveQrResponse> {
    const company = await this.companyRepo.findByCode(companyCode)
    if (!company) throw new CompanyCodeNotFoundError()
    return this.getOrCreateActiveSession(company.id)
  }

  determineWorkDate(timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(this.clockService.now())
  }

  getLocalTimeString(timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return formatter.format(this.clockService.now())
  }

  getDayOfWeek(timezone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    })
    const name = formatter.format(this.clockService.now()).toLowerCase()
    const map: Record<string, number> = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 7,
    }
    return map[name] ?? 0
  }

  determineActiveEventType(schedule: WorkScheduleData, localTime: string): string | null {
    const nowMinutes = this.toMinutes(localTime)
    const startMinutes = this.toMinutes(schedule.start_time)

    const arrivalStart = startMinutes - QR_CONFIG.ARRIVAL_WINDOW_OPEN_MINUTES
    const arrivalEnd = startMinutes + QR_CONFIG.ARRIVAL_WINDOW_CLOSE_MINUTES
    if (nowMinutes >= arrivalStart && nowMinutes < arrivalEnd) return 'ARRIVAL'

    if (schedule.break_start_time) {
      const breakStartMinutes = this.toMinutes(schedule.break_start_time)
      const bsStart = breakStartMinutes - QR_CONFIG.BREAK_WINDOW_OPEN_MINUTES
      const bsEnd = breakStartMinutes + QR_CONFIG.BREAK_WINDOW_CLOSE_MINUTES
      if (nowMinutes >= bsStart && nowMinutes < bsEnd) return 'BREAK_START'
    }

    if (schedule.break_end_time) {
      const breakEndMinutes = this.toMinutes(schedule.break_end_time)
      const beStart = breakEndMinutes - QR_CONFIG.BREAK_WINDOW_OPEN_MINUTES
      const beEnd = breakEndMinutes + QR_CONFIG.BREAK_WINDOW_CLOSE_MINUTES
      if (nowMinutes >= beStart && nowMinutes < beEnd) return 'BREAK_END'
    }

    const endMinutes = this.toMinutes(schedule.end_time)
    const depStart = endMinutes - QR_CONFIG.DEPARTURE_WINDOW_OPEN_MINUTES
    const depEnd = endMinutes + QR_CONFIG.DEPARTURE_WINDOW_CLOSE_MINUTES
    if (nowMinutes >= depStart && nowMinutes < depEnd) return 'DEPARTURE'

    return null
  }

  private toMinutes(time: string): number {
    const parts = time.split(':')
    const h = parseInt(parts[0] ?? '0', 10)
    const m = parseInt(parts[1] ?? '0', 10)
    return h * 60 + m
  }

  private generateToken(): { raw: string; hash: string } {
    const raw = randomBytes(QR_CONFIG.TOKEN_BYTES).toString('hex')
    const hash = createHash('sha256').update(raw).digest('hex')
    return { raw, hash }
  }

  private getWindowDuration(eventType: string): number {
    switch (eventType) {
      case 'ARRIVAL': return QR_CONFIG.ARRIVAL_WINDOW_OPEN_MINUTES + QR_CONFIG.ARRIVAL_WINDOW_CLOSE_MINUTES
      case 'BREAK_START': return QR_CONFIG.BREAK_WINDOW_OPEN_MINUTES + QR_CONFIG.BREAK_WINDOW_CLOSE_MINUTES
      case 'BREAK_END': return QR_CONFIG.BREAK_WINDOW_OPEN_MINUTES + QR_CONFIG.BREAK_WINDOW_CLOSE_MINUTES
      case 'DEPARTURE': return QR_CONFIG.DEPARTURE_WINDOW_OPEN_MINUTES + QR_CONFIG.DEPARTURE_WINDOW_CLOSE_MINUTES
      default: return 60
    }
  }
}
