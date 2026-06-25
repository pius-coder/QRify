import type { AttendanceData } from '../../database/repositories/contracts/attendance.repository'
import type { ScanEventData } from '../../database/repositories/contracts/scan-event.repository'

export interface AttendanceResponse {
  id: string
  companyId: string
  userId: string
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
  createdAt: string
  updatedAt: string
}

export interface ScanEventInfo {
  id: string
  eventType: string
  scannedAt: string
  result: string
}

export interface AttendanceDetailResponse extends AttendanceResponse {
  events: ScanEventInfo[]
}

export interface ListAttendancesQuery {
  date?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface AttendanceListResponseData {
  attendances: AttendanceResponse[]
  pagination: PaginationMeta
}

export function toAttendanceResponse(r: AttendanceData): AttendanceResponse {
  return {
    id: r.id,
    companyId: r.company_id,
    userId: r.user_id,
    workDate: r.work_date,
    arrivalAt: r.arrival_at,
    breakStartAt: r.break_start_at,
    breakEndAt: r.break_end_at,
    departureAt: r.departure_at,
    status: r.status,
    lateMinutes: r.late_minutes,
    breakMinutes: r.break_minutes,
    workedMinutes: r.worked_minutes,
    overtimeMinutes: r.overtime_minutes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toAttendanceDetailResponse(r: AttendanceData, events: ScanEventData[]): AttendanceDetailResponse {
  return {
    ...toAttendanceResponse(r),
    events: events.map((e) => ({
      id: e.id,
      eventType: e.event_type,
      scannedAt: e.scanned_at,
      result: e.result,
    })),
  }
}

export function toScanEventInfo(e: ScanEventData): ScanEventInfo {
  return {
    id: e.id,
    eventType: e.event_type,
    scannedAt: e.scanned_at,
    result: e.result,
  }
}
