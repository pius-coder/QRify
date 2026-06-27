import type { AttendanceRepository } from '../../database/repositories/contracts/attendance.repository'
import type { ScanEventRepository } from '../../database/repositories/contracts/scan-event.repository'
import type { UserRepository } from '../../database/repositories/contracts/user.repository'
import { MeNotFoundError } from './me.errors'
import type {
  AttendanceRecordResponse,
  AttendanceListResponse,
  AttendanceDetailResponse,
  AttendanceSummaryResponse,
  TodayAttendanceResponse,
  UpdateProfileDTO,
} from './me.types'
import { toAttendanceRecordResponse, toScanEventResponse } from './me.types'

const EVENT_SEQUENCE = ['ARRIVAL', 'BREAK_START', 'BREAK_END', 'DEPARTURE']

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function resolveDateRange(startDate?: string, endDate?: string): { startDate: string; endDate: string } | null {
  if (!startDate && !endDate) return null
  return {
    startDate: startDate ?? '1970-01-01',
    endDate: endDate ?? getTodayDate(),
  }
}

function determineNextExpectedEvent(acceptedEventTypes: string[]): string | null {
  for (const event of EVENT_SEQUENCE) {
    if (!acceptedEventTypes.includes(event)) {
      return event
    }
  }
  return null
}

export class MeService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private scanEventRepo: ScanEventRepository,
    private userRepo: UserRepository,
  ) {}

  async getTodayAttendance(userId: string, _companyId: string): Promise<TodayAttendanceResponse> {
    const today = getTodayDate()
    const attendance = await this.attendanceRepo.findByUserAndDate(userId, today)
    const scanEvents = await this.scanEventRepo.findByUserAndDate(userId, today)
    const acceptedTypes = scanEvents
      .filter((e) => e.result === 'ACCEPTED')
      .map((e) => e.event_type)
    const nextEvent = determineNextExpectedEvent(acceptedTypes)

    return {
      date: today,
      attendance: attendance ? toAttendanceRecordResponse(attendance) : null,
      scanEvents: scanEvents.map(toScanEventResponse),
      nextExpectedEvent: nextEvent,
    }
  }

  async getAttendances(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceListResponse> {
    const range = resolveDateRange(startDate, endDate)
    const records = range
      ? await this.attendanceRepo.findByUserAndDateRange(userId, range.startDate, range.endDate)
      : await this.attendanceRepo.findAllByUser(userId)

    return {
      attendances: records.map(toAttendanceRecordResponse),
      total: records.length,
    }
  }

  async getAttendanceByDate(userId: string, date: string): Promise<AttendanceDetailResponse> {
    const attendance = await this.attendanceRepo.findByUserAndDate(userId, date)
    const scanEvents = await this.scanEventRepo.findByUserAndDate(userId, date)

    if (!attendance) {
      throw new MeNotFoundError(`No attendance record found for ${date}`)
    }

    return {
      attendance: toAttendanceRecordResponse(attendance),
      scanEvents: scanEvents.map(toScanEventResponse),
    }
  }

  async getAttendanceSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceSummaryResponse> {
    const range = resolveDateRange(startDate, endDate)
    const records = range
      ? await this.attendanceRepo.findByUserAndDateRange(userId, range.startDate, range.endDate)
      : await this.attendanceRepo.findAllByUser(userId)

    return {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === 'PRESENT' || r.status === 'INCOMPLETE').length,
      lateDays: records.filter((r) => r.status === 'LATE').length,
      absentDays: records.filter((r) => r.status === 'ABSENT').length,
      totalLateMinutes: records.reduce((sum, r) => sum + r.late_minutes, 0),
      totalWorkedMinutes: records.reduce((sum, r) => sum + r.worked_minutes, 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + r.overtime_minutes, 0),
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<{ id: string; firstName: string; lastName: string }> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new MeNotFoundError('User not found')
    }

    const updated = await this.userRepo.update(userId, {
      first_name: dto.firstName,
      last_name: dto.lastName,
    })

    if (!updated) {
      throw new MeNotFoundError('User not found')
    }

    return {
      id: updated.id,
      firstName: updated.first_name,
      lastName: updated.last_name,
    }
  }
}
