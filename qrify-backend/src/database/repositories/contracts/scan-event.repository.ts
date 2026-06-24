export interface ScanEventData {
  id: string
  company_id: string
  user_id: string
  qr_session_id: string | null
  event_type: string
  scanned_at: string
  result: string
  created_at: string
}

export interface ScanEventRepository {
  create(data: Omit<ScanEventData, 'id' | 'created_at'>): Promise<ScanEventData>
  findByUserAndDate(userId: string, workDate: string): Promise<ScanEventData[]>
  findLastByUserAndType(userId: string, eventType: string, workDate: string): Promise<ScanEventData | null>
}
