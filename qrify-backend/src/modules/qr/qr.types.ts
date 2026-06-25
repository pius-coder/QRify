import type { QrSessionData } from '../../database/repositories/contracts/qr-session.repository'

export interface ActiveQrResponse {
  sessionId: string
  companyId: string
  companyName: string
  eventType: string
  token: string
  validFrom: string
  validUntil: string
  workDate: string
}

export function toActiveQrResponse(session: QrSessionData, rawToken: string, companyName: string): ActiveQrResponse {
  return {
    sessionId: session.id,
    companyId: session.company_id,
    companyName,
    eventType: session.event_type,
    token: rawToken,
    validFrom: session.valid_from,
    validUntil: session.valid_until,
    workDate: session.work_date,
  }
}
