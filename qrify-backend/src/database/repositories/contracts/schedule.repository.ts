export interface WorkScheduleData {
  id: string
  company_id: string
  start_time: string
  break_start_time: string | null
  break_end_time: string | null
  end_time: string
  late_tolerance_minutes: number
  created_at: string
  updated_at: string
}

export interface WorkScheduleDayData {
  id: string
  schedule_id: string
  weekday: number
}

export interface ScheduleRepository {
  findByCompanyId(companyId: string): Promise<WorkScheduleData | null>
  upsert(companyId: string, data: Omit<WorkScheduleData, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<WorkScheduleData>
  findDaysByScheduleId(scheduleId: string): Promise<WorkScheduleDayData[]>
  upsertDays(scheduleId: string, weekdays: number[]): Promise<WorkScheduleDayData[]>
}
