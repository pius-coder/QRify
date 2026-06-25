import { createHash, randomUUID } from 'node:crypto'
import type { QrSessionRepository, QrSessionData } from '../../database/repositories/contracts/qr-session.repository'
import type { ScanEventRepository } from '../../database/repositories/contracts/scan-event.repository'
import type { UserRepository } from '../../database/repositories/contracts/user.repository'
import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { DatabaseAdapter } from '../../database/database.types'
import { ClockService } from '../../services/clock.service'
import type { AttendanceService } from '../attendances/attendances.service'
import type { SubmitScanDTO, ScanResponse } from './scans.types'
import { toScanResponse } from './scans.types'
import {
  InvalidTokenError,
  ExpiredTokenError,
  WrongCompanyError,
  UserNotActiveError,
  CompanySuspendedError,
  DuplicateScanError,
  InvalidSequenceError,
} from './scans.errors'

const EVENT_ORDER: string[] = ['ARRIVAL', 'BREAK_START', 'BREAK_END', 'DEPARTURE']

const FIELD_MAP: Record<string, string> = {
  ARRIVAL: 'arrival_at',
  BREAK_START: 'break_start_at',
  BREAK_END: 'break_end_at',
  DEPARTURE: 'departure_at',
}

export class ScanService {
  constructor(
    private db: DatabaseAdapter,
    private qrSessionRepo: QrSessionRepository,
    private scanEventRepo: ScanEventRepository,
    private userRepo: UserRepository,
    private companyRepo: CompanyRepository,
    private clockService: ClockService,
    private attendanceService?: AttendanceService,
  ) {}

  async processScan(userId: string, companyId: string, dto: SubmitScanDTO): Promise<ScanResponse> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex')
    const session = await this.qrSessionRepo.findByTokenHash(tokenHash)

    if (!session) {
      await this.recordRejection(companyId, userId, null, 'ARRIVAL', 'INVALID_TOKEN')
      throw new InvalidTokenError()
    }

    if (session.company_id !== companyId) {
      await this.recordRejection(companyId, userId, session.id, session.event_type, 'WRONG_COMPANY')
      throw new WrongCompanyError()
    }

    const now = this.clockService.now()
    if (new Date(session.valid_until) <= now) {
      await this.recordRejection(companyId, userId, session.id, session.event_type, 'EXPIRED', now.toISOString())
      throw new ExpiredTokenError()
    }

    const user = await this.userRepo.findById(userId)
    if (!user || user.status !== 'ACTIVE') {
      await this.recordRejection(companyId, userId, session.id, session.event_type, 'USER_NOT_ACTIVE', now.toISOString())
      throw new UserNotActiveError()
    }

    const company = await this.companyRepo.findById(companyId)
    if (!company || company.status !== 'ACTIVE') {
      await this.recordRejection(companyId, userId, session.id, session.event_type, 'COMPANY_SUSPENDED', now.toISOString())
      throw new CompanySuspendedError()
    }

    const sequenceError = await this.validateSequence(userId, session)
    if (sequenceError) {
      await this.recordRejection(companyId, userId, session.id, session.event_type, 'INVALID_SEQUENCE', now.toISOString())
      throw new InvalidSequenceError(sequenceError)
    }

    const scannedAt = now.toISOString()
    let attendanceId: string | undefined

    const scanEvent = this.db.transaction(() => {
      const existing = this.db.query<{ result: string }>(
        "SELECT result FROM scan_events WHERE user_id = ? AND event_type = ? AND date(scanned_at) = ? AND result = 'ACCEPTED' LIMIT 1",
        [userId, session.event_type, session.work_date],
      ).rows[0]

      if (existing) {
        this.db.run(
          'INSERT INTO scan_events (id, company_id, user_id, qr_session_id, event_type, scanned_at, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [randomUUID(), companyId, userId, session.id, session.event_type, scannedAt, 'DUPLICATE'],
        )
        throw new DuplicateScanError(session.event_type)
      }

      const eventId = randomUUID()
      this.db.run(
        'INSERT INTO scan_events (id, company_id, user_id, qr_session_id, event_type, scanned_at, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [eventId, companyId, userId, session.id, session.event_type, scannedAt, 'ACCEPTED'],
      )

      const field = FIELD_MAP[session.event_type]
      if (field) {
        const existingRecord = this.db.query<{ id: string }>(
          'SELECT id FROM attendance_records WHERE user_id = ? AND work_date = ?',
          [userId, session.work_date],
        ).rows[0]

        if (existingRecord) {
          attendanceId = existingRecord.id
          this.db.run(
            `UPDATE attendance_records SET ${field} = ?, status = 'PRESENT', updated_at = datetime('now') WHERE id = ?`,
            [scannedAt, existingRecord.id],
          )
        } else if (session.event_type === 'ARRIVAL') {
          attendanceId = randomUUID()
          this.db.run(
            `INSERT INTO attendance_records (id, company_id, user_id, work_date, arrival_at, status, late_minutes, break_minutes, worked_minutes, overtime_minutes)
             VALUES (?, ?, ?, ?, ?, 'PRESENT', 0, 0, 0, 0)`,
            [attendanceId, companyId, userId, session.work_date, scannedAt],
          )
        }
      }

      const { rows } = this.db.query<{ id: string; event_type: string; result: string; scanned_at: string }>(
        'SELECT id, event_type, result, scanned_at FROM scan_events WHERE id = ?',
        [eventId],
      )
      return rows[0]!
    })

    if (attendanceId && this.attendanceService) {
      try {
        await this.attendanceService.calculate(attendanceId)
      } catch {
        // Calculation failure should not fail the scan
      }
    }

    return toScanResponse(scanEvent)
  }

  private async recordRejection(
    companyId: string,
    userId: string,
    qrSessionId: string | null,
    eventType: string,
    result: string,
    scannedAt?: string,
  ): Promise<void> {
    await this.scanEventRepo.create({
      company_id: companyId,
      user_id: userId,
      qr_session_id: qrSessionId,
      event_type: eventType,
      scanned_at: scannedAt ?? this.clockService.nowISO(),
      result,
    })
  }

  private async validateSequence(userId: string, session: QrSessionData): Promise<string | null> {
    const eventIdx = EVENT_ORDER.indexOf(session.event_type)
    if (eventIdx < 0) return `Unknown event type: ${session.event_type}`

    if (eventIdx === 0) return null

    const requiredEvents = EVENT_ORDER.slice(0, eventIdx)
    for (const required of requiredEvents) {
      const lastEvent = await this.scanEventRepo.findLastByUserAndType(userId, required, session.work_date)
      if (!lastEvent || lastEvent.result !== 'ACCEPTED') {
        return `Cannot scan ${session.event_type}: ${required} must be completed first`
      }
    }

    const laterEvents = EVENT_ORDER.slice(eventIdx + 1)
    for (const later of laterEvents) {
      const lastEvent = await this.scanEventRepo.findLastByUserAndType(userId, later, session.work_date)
      if (lastEvent && lastEvent.result === 'ACCEPTED') {
        return `Cannot scan ${session.event_type}: ${later} already completed`
      }
    }

    return null
  }
}
