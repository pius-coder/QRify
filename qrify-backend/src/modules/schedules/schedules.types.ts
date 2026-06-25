import type { WorkScheduleData, WorkScheduleDayData } from '../../database/repositories/contracts/schedule.repository'

export const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

export interface ScheduleResponse {
  id: string
  companyId: string
  startTime: string
  breakStartTime: string | null
  breakEndTime: string | null
  endTime: string
  lateToleranceMinutes: number
  weekdays: number[]
  createdAt: string
  updatedAt: string
}

export interface UpdateScheduleDTO {
  startTime: string
  breakStartTime: string | null
  breakEndTime: string | null
  endTime: string
  lateToleranceMinutes: number
  weekdays: number[]
}

export function toScheduleResponse(
  schedule: WorkScheduleData,
  days: WorkScheduleDayData[],
): ScheduleResponse {
  return {
    id: schedule.id,
    companyId: schedule.company_id,
    startTime: schedule.start_time,
    breakStartTime: schedule.break_start_time,
    breakEndTime: schedule.break_end_time,
    endTime: schedule.end_time,
    lateToleranceMinutes: schedule.late_tolerance_minutes,
    weekdays: days.map((d) => d.weekday).sort(),
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at,
  }
}
