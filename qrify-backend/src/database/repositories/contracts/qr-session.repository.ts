export interface QrSessionData {
  id: string
  company_id: string
  work_date: string
  event_type: string
  token_hash: string
  valid_from: string
  valid_until: string
  status: string
  created_at: string
}

export interface QrSessionRepository {
  findActiveByCompanyAndType(companyId: string, eventType: string, workDate: string): Promise<QrSessionData | null>
  create(data: Omit<QrSessionData, 'id' | 'created_at'>): Promise<QrSessionData>
  expireById(id: string): Promise<void>
  revokeByCompanyAndDate(companyId: string, workDate: string): Promise<void>
}
