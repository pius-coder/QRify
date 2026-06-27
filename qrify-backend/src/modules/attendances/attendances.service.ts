import type { AttendanceData, AttendanceRepository } from '../../database/repositories/contracts/attendance.repository'
import type { CompanyRepository, CompanyData } from '../../database/repositories/contracts/company.repository'
import type { ScheduleRepository, WorkScheduleData } from '../../database/repositories/contracts/schedule.repository'
import type { ScanEventRepository, ScanEventData } from '../../database/repositories/contracts/scan-event.repository'
import type { UserRepository } from '../../database/repositories/contracts/user.repository'
import { ClockService } from '../../services/clock.service'
import type {
  AttendanceResponse,
  AttendanceDetailResponse,
  AttendanceListResponseData,
  ListAttendancesQuery,
  PaginationMeta,
} from './attendances.types'
import { toAttendanceResponse, toAttendanceDetailResponse } from './attendances.types'
import {
  AttendanceNotFoundError,
  AttendanceNotInCompanyError,
  CompanyNotActiveError,
  EmployeeNotActiveError,
  NotWorkingDayError,
} from './attendances.errors'

function getMinutesInTimezone(isoTimestamp: string | null, timezone: string): number | null {
  if (!isoTimestamp) return null
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const timeStr = formatter.format(new Date(isoTimestamp))
  const parts = timeStr.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function getDateInTimezone(isoTimestamp: string | null, timezone: string): string | null {
  if (!isoTimestamp) return null
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date(isoTimestamp))
}

function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function nowInTimezone(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dateStr = formatter.format(now)
  return new Date(dateStr + 'T23:59:59.999Z')
}

function isWorkingDay(weekdays: number[], dateStr: string): boolean {
  const date = new Date(dateStr)
  const day = date.getDay()
  const weekday = day === 0 ? 7 : day
  return weekdays.includes(weekday)
}

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private scheduleRepo: ScheduleRepository,
    private companyRepo: CompanyRepository,
    private scanEventRepo: ScanEventRepository,
    private userRepo: UserRepository,
    private clockService: ClockService,
  ) {}

  async calculate(id: string): Promise<AttendanceResponse> {
    const record = await this.attendanceRepo.findById(id)
    if (!record) throw new AttendanceNotFoundError()

    const company = await this.companyRepo.findById(record.company_id)
    if (!company) throw new AttendanceNotFoundError()

    const schedule = await this.scheduleRepo.findByCompanyId(record.company_id)

    const updated = await this.recalculateRecord(record, company, schedule)
    return toAttendanceResponse(updated)
  }

  async recalculateRecord(
    record: AttendanceData,
    company: CompanyData,
    schedule: WorkScheduleData | null,
  ): Promise<AttendanceData> {
    const timezone = company.timezone
    const arrivalMinutes = getMinutesInTimezone(record.arrival_at, timezone)
    const departureMinutes = getMinutesInTimezone(record.departure_at, timezone)

    const scheduledStartMinutes = schedule ? parseTimeToMinutes(schedule.start_time) : null
    const scheduledEndMinutes = schedule ? parseTimeToMinutes(schedule.end_time) : null
    const breakStartSchedule = schedule ? parseTimeToMinutes(schedule.break_start_time) : null
    const breakEndSchedule = schedule ? parseTimeToMinutes(schedule.break_end_time) : null
    const tolerance = schedule?.late_tolerance_minutes ?? 0

    let lateMinutes = 0
    if (arrivalMinutes !== null && scheduledStartMinutes !== null) {
      const threshold = scheduledStartMinutes + tolerance
      lateMinutes = Math.max(0, arrivalMinutes - threshold)
    }

    let breakMinutes = 0
    const hasBreakStart = Boolean(record.break_start_at)
    const hasBreakEnd = Boolean(record.break_end_at)
    const scheduleHasBreak = breakStartSchedule !== null && breakEndSchedule !== null
    const incompleteBreak = scheduleHasBreak && (hasBreakStart !== hasBreakEnd)

    if (hasBreakStart && hasBreakEnd) {
      const bsMinutes = getMinutesInTimezone(record.break_start_at, timezone)
      const beMinutes = getMinutesInTimezone(record.break_end_at, timezone)
      if (bsMinutes !== null && beMinutes !== null) {
        breakMinutes = Math.max(0, beMinutes - bsMinutes)
      }
    }

    let workedMinutes = 0
    if (arrivalMinutes !== null && departureMinutes !== null) {
      workedMinutes = Math.max(0, departureMinutes - arrivalMinutes - breakMinutes)
    }

    let overtimeMinutes = 0
    if (departureMinutes !== null && scheduledEndMinutes !== null) {
      overtimeMinutes = Math.max(0, departureMinutes - scheduledEndMinutes)
    }

    let status = 'PRESENT'
    if (!record.arrival_at) {
      status = 'ABSENT'
    } else if (incompleteBreak) {
      status = 'INCOMPLETE'
    } else if (lateMinutes > 0) {
      status = 'LATE'
    }

    const updated = await this.attendanceRepo.update(record.id, {
      status,
      late_minutes: lateMinutes,
      break_minutes: breakMinutes,
      worked_minutes: workedMinutes,
      overtime_minutes: overtimeMinutes,
    })

    return updated ?? record
  }

  async list(companyId: string, query: ListAttendancesQuery): Promise<AttendanceListResponseData> {
    const date = query.date ?? getDateInTimezone(this.clockService.nowISO(), 'UTC') ?? ''
    const records = await this.attendanceRepo.findByCompanyAndDate(companyId, date)

    const allCompanyUsers = await this.userRepo.findAllByCompany(companyId)
    const userMap = new Map(allCompanyUsers.map((u) => [u.id, u]))

    let filtered = records

    if (query.status) {
      filtered = filtered.filter((r) => r.status === query.status)
    }

    if (query.search) {
      const q = query.search.toLowerCase()
      const matchedIds = new Set(
        allCompanyUsers
          .filter((u) => u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
          .map((u) => u.id),
      )
      filtered = filtered.filter((r) => matchedIds.has(r.user_id))
    }

    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const total = filtered.length
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return {
      attendances: paged.map((r) => {
        const u = userMap.get(r.user_id)
        return toAttendanceResponse(r, u ? { firstName: u.first_name, lastName: u.last_name, email: u.email } : undefined)
      }),
      pagination: { page, limit, total },
    }
  }

  async getById(companyId: string, id: string): Promise<AttendanceDetailResponse> {
    const record = await this.attendanceRepo.findById(id)
    if (!record) throw new AttendanceNotFoundError()
    if (record.company_id !== companyId) throw new AttendanceNotInCompanyError()

    const user = await this.userRepo.findById(record.user_id)
    const events = await this.scanEventRepo.findByUserAndDate(record.user_id, record.work_date)

    return toAttendanceDetailResponse(record, events, user ? { firstName: user.first_name, lastName: user.last_name, email: user.email } : undefined)
  }

  async detectAbsencesForCompany(companyId: string, workDate: string): Promise<number> {
    const company = await this.companyRepo.findById(companyId)
    if (!company || company.status !== 'ACTIVE') return 0

    const schedule = await this.scheduleRepo.findByCompanyId(companyId)
    if (!schedule) return 0

    const days = await this.scheduleRepo.findDaysByScheduleId(schedule.id)
    const weekdays = days.map((d) => d.weekday)
    if (!isWorkingDay(weekdays, workDate)) return 0

    const existingRecords = await this.attendanceRepo.findByCompanyAndDate(companyId, workDate)
    const employeesWithArrival = new Set(existingRecords.filter((r) => r.arrival_at).map((r) => r.user_id))

    const allUsers = await this.userRepo.findAllByCompany(companyId)
    const activeEmployees = allUsers.filter((u) => u.role === 'EMPLOYEE' && u.status === 'ACTIVE')

    let markedAbsent = 0

    for (const emp of activeEmployees) {
      if (!employeesWithArrival.has(emp.id)) {
        try {
          await this.attendanceRepo.create({
            company_id: companyId,
            user_id: emp.id,
            work_date: workDate,
            arrival_at: null,
            break_start_at: null,
            break_end_at: null,
            departure_at: null,
            status: 'ABSENT',
            late_minutes: 0,
            break_minutes: 0,
            worked_minutes: 0,
            overtime_minutes: 0,
          })
          markedAbsent++
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
            continue
          }
          throw err
        }
      }
    }

    return markedAbsent
  }

  async runAbsenceDetection(date?: string): Promise<number> {
    const companies = await this.companyRepo.findAll()
    const activeCompanies = companies.filter((c) => c.status === 'ACTIVE')
    let markedAbsent = 0

    for (const company of activeCompanies) {
      const workDate = date ?? getDateInTimezone(this.clockService.nowISO(), company.timezone)
      if (!workDate) continue

      markedAbsent += await this.detectAbsencesForCompany(company.id, workDate)
    }

    return markedAbsent
  }

  async isDayOver(companyId: string): Promise<boolean> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) return false

    const schedule = await this.scheduleRepo.findByCompanyId(companyId)
    if (!schedule) return false

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: company.timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const timeStr = formatter.format(now)
    const parts = timeStr.split(':')
    const currentMinutes = Number(parts[0]) * 60 + Number(parts[1])
    if (Number.isNaN(currentMinutes)) return false

    const endMinutes = parseTimeToMinutes(schedule.end_time)
    if (endMinutes === null) return false

    const buffer = 60
    const threshold = Math.min(endMinutes + buffer, 1439)
    return currentMinutes >= threshold
  }
}
