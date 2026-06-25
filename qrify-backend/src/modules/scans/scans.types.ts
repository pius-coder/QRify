export const SCAN_RESULTS = {
  ACCEPTED: 'ACCEPTED',
  DUPLICATE: 'DUPLICATE',
  EXPIRED: 'EXPIRED',
  INVALID_SEQUENCE: 'INVALID_SEQUENCE',
  WRONG_COMPANY: 'WRONG_COMPANY',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  COMPANY_SUSPENDED: 'COMPANY_SUSPENDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const

export type ScanResult = typeof SCAN_RESULTS[keyof typeof SCAN_RESULTS]

export interface SubmitScanDTO {
  token: string
}

export interface ScanResponse {
  id: string
  eventType: string
  result: string
  scannedAt: string
}

export interface ScanEventRow {
  id: string
  event_type: string
  result: string
  scanned_at: string
}

export function toScanResponse(event: ScanEventRow): ScanResponse {
  return {
    id: event.id,
    eventType: event.event_type,
    result: event.result,
    scannedAt: event.scanned_at,
  }
}
