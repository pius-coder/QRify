import type { AttendanceData } from '../../database/repositories/contracts/attendance.repository'
import type { ScanEventData } from '../../database/repositories/contracts/scan-event.repository'

export interface AttendanceRecordResponse {
  id: string
  workDate: string
  arrivalAt: string | null
  breakStartAt: string | null
  breakEndAt: string | null
  departureAt: string | null
  status: string
  lateMinutes: number
  breakMinutes: number
  workedMinutes: number
  overtimeMinutes: number
}

export interface ScanEventResponse {
  id: string
  eventType: string
  scannedAt: string
  result: string
}

export interface TodayAttendanceResponse {
  date: string
  attendance: AttendanceRecordResponse | null
  scanEvents: ScanEventResponse[]
  nextExpectedEvent: string | null
}

export interface AttendanceListResponse {
  attendances: AttendanceRecordResponse[]
  total: number
}

export interface AttendanceDetailResponse {
  attendance: AttendanceRecordResponse | null
  scanEvents: ScanEventResponse[]
}

export interface AttendanceSummaryResponse {
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  totalLateMinutes: number
  totalWorkedMinutes: number
  totalOvertimeMinutes: number
}

export interface UpdateProfileDTO {
  firstName?: string
  lastName?: string
}

export function toAttendanceRecordResponse(record: AttendanceData): AttendanceRecordResponse {
  return {
    id: record.id,
    workDate: record.work_date,
    arrivalAt: record.arrival_at,
    breakStartAt: record.break_start_at,
    breakEndAt: record.break_end_at,
    departureAt: record.departure_at,
    status: record.status,
    lateMinutes: record.late_minutes,
    breakMinutes: record.break_minutes,
    workedMinutes: record.worked_minutes,
    overtimeMinutes: record.overtime_minutes,
  }
}

export function toScanEventResponse(event: ScanEventData): ScanEventResponse {
  return {
    id: event.id,
    eventType: event.event_type,
    scannedAt: event.scanned_at,
    result: event.result,
  }
}
