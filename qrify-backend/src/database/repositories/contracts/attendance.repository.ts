export interface AttendanceData {
  id: string
  company_id: string
  user_id: string
  work_date: string
  arrival_at: string | null
  break_start_at: string | null
  break_end_at: string | null
  departure_at: string | null
  status: string
  late_minutes: number
  break_minutes: number
  worked_minutes: number
  overtime_minutes: number
  created_at: string
  updated_at: string
}

export interface AttendanceRepository {
  findById(id: string): Promise<AttendanceData | null>
  findByUserAndDate(userId: string, workDate: string): Promise<AttendanceData | null>
  create(data: Omit<AttendanceData, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceData>
  update(id: string, data: Partial<AttendanceData>): Promise<AttendanceData | null>
  findByCompanyAndDate(companyId: string, workDate: string): Promise<AttendanceData[]>
  findAllByUser(userId: string): Promise<AttendanceData[]>
}
