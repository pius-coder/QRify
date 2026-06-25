import { describe, it, expect, beforeEach } from 'bun:test'
import { createHash } from 'node:crypto'
import type { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { ScanService } from './scans.service'
import { InvalidTokenError, ExpiredTokenError, WrongCompanyError, UserNotActiveError, CompanySuspendedError, DuplicateScanError, InvalidSequenceError } from './scans.errors'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

describe('ScanService', () => {
  let adapter: SqliteAdapter
  let qrSessionRepo: SqliteQrSessionRepository
  let scanEventRepo: SqliteScanEventRepository
  let attendanceRepo: SqliteAttendanceRepository
  let userRepo: SqliteUserRepository
  let companyRepo: SqliteCompanyRepository
  let service: ScanService

  const fixedNow = new Date('2026-06-25T08:00:00.000Z')

  beforeEach(async () => {
    adapter = createTestDb()
    qrSessionRepo = new SqliteQrSessionRepository(adapter)
    scanEventRepo = new SqliteScanEventRepository(adapter)
    attendanceRepo = new SqliteAttendanceRepository(adapter)
    userRepo = new SqliteUserRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)

    service = new ScanService(
      adapter,
      qrSessionRepo,
      scanEventRepo,
      userRepo,
      companyRepo,
      { now: () => fixedNow, nowISO: () => fixedNow.toISOString() },
    )

    await companyRepo.create({
      id: 'company-1',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })

    await userRepo.create({
      id: 'user-1',
      company_id: 'company-1',
      first_name: 'Alice',
      last_name: 'Martin',
      email: 'alice@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })

    await qrSessionRepo.create({
      company_id: 'company-1',
      work_date: '2026-06-25',
      event_type: 'ARRIVAL',
      token_hash: hashToken('a'.repeat(64)),
      valid_from: '2026-06-25T07:30:00.000Z',
      valid_until: '2026-06-25T08:30:00.000Z',
      status: 'ACTIVE',
    })
  })

  describe('processScan', () => {
    it('returns ACCEPTED for valid ARRIVAL scan', async () => {
      const result = await service.processScan('user-1', 'company-1', { token: 'a'.repeat(64) })
      expect(result.result).toBe('ACCEPTED')
      expect(result.eventType).toBe('ARRIVAL')
      expect(result.scannedAt).toBe(fixedNow.toISOString())
    })

    it('creates attendance record on ACCEPTED ARRIVAL', async () => {
      await service.processScan('user-1', 'company-1', { token: 'a'.repeat(64) })
      const record = await attendanceRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(record).not.toBeNull()
      expect(record!.arrival_at).toBe(fixedNow.toISOString())
    })

    it('rejects invalid token', async () => {
      expect(
        service.processScan('user-1', 'company-1', { token: 'b'.repeat(64) }),
      ).rejects.toThrow(InvalidTokenError)

      const events = await scanEventRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(events).toHaveLength(1)
      expect(events[0]!.result).toBe('INVALID_TOKEN')
    })

    it('rejects scan from wrong company', async () => {
      await companyRepo.create({
        id: 'company-2',
        name: 'Other Corp',
        company_code: 'OTHER01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      await userRepo.create({
        id: 'user-2',
        company_id: 'company-2',
        first_name: 'Bob',
        last_name: 'Dupont',
        email: 'bob@test.com',
        password_hash: 'hash',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      })

      expect(
        service.processScan('user-2', 'company-2', { token: 'a'.repeat(64) }),
      ).rejects.toThrow(WrongCompanyError)

      const events = await scanEventRepo.findByUserAndDate('user-2', '2026-06-25')
      expect(events).toHaveLength(1)
      expect(events[0]!.result).toBe('WRONG_COMPANY')
    })

    it('rejects expired token', async () => {
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'BREAK_START',
        token_hash: hashToken('d'.repeat(64)),
        valid_from: '2026-06-25T11:30:00.000Z',
        valid_until: '2026-06-25T11:45:00.000Z',
        status: 'ACTIVE',
      })

      const afterExpiry = new Date('2026-06-25T12:00:00.000Z')
      const expiredService = new ScanService(
        adapter,
        qrSessionRepo,
        scanEventRepo,
        userRepo,
        companyRepo,
        { now: () => afterExpiry, nowISO: () => afterExpiry.toISOString() },
      )

      expect(
        expiredService.processScan('user-1', 'company-1', { token: 'd'.repeat(64) }),
      ).rejects.toThrow(ExpiredTokenError)

      const events = await scanEventRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(events).toHaveLength(1)
      expect(events[0]!.result).toBe('EXPIRED')
    })

    it('rejects scan for non-active user', async () => {
      await userRepo.updateStatus('user-1', 'SUSPENDED')

      expect(
        service.processScan('user-1', 'company-1', { token: 'a'.repeat(64) }),
      ).rejects.toThrow(UserNotActiveError)

      const events = await scanEventRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(events).toHaveLength(1)
      expect(events[0]!.result).toBe('USER_NOT_ACTIVE')
    })

    it('rejects scan for suspended company', async () => {
      await companyRepo.update('company-1', { status: 'SUSPENDED' })

      expect(
        service.processScan('user-1', 'company-1', { token: 'a'.repeat(64) }),
      ).rejects.toThrow(CompanySuspendedError)

      const events = await scanEventRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(events).toHaveLength(1)
      expect(events[0]!.result).toBe('COMPANY_SUSPENDED')
    })

    it('rejects duplicate scan', async () => {
      const nextDay = new Date('2026-06-26T08:00:00.000Z')
      const nextDayService = new ScanService(
        adapter,
        qrSessionRepo,
        scanEventRepo,
        userRepo,
        companyRepo,
        { now: () => nextDay, nowISO: () => nextDay.toISOString() },
      )

      const firstSession = await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-26',
        event_type: 'ARRIVAL',
        token_hash: hashToken('x'.repeat(64)),
        valid_from: '2026-06-26T07:30:00.000Z',
        valid_until: '2026-06-26T08:30:00.000Z',
        status: 'ACTIVE',
      })

      await nextDayService.processScan('user-1', 'company-1', { token: 'x'.repeat(64) })

      const secondSession = await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-26',
        event_type: 'ARRIVAL',
        token_hash: hashToken('y'.repeat(64)),
        valid_from: '2026-06-26T07:30:00.000Z',
        valid_until: '2026-06-26T08:30:00.000Z',
        status: 'ACTIVE',
      })

      expect(
        nextDayService.processScan('user-1', 'company-1', { token: 'y'.repeat(64) }),
      ).rejects.toThrow(DuplicateScanError)
    })

    it('rejects BREAK_START before ARRIVAL', async () => {
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'BREAK_START',
        token_hash: hashToken('e'.repeat(64)),
        valid_from: '2026-06-25T11:45:00.000Z',
        valid_until: '2026-06-25T12:15:00.000Z',
        status: 'ACTIVE',
      })

      expect(
        service.processScan('user-1', 'company-1', { token: 'e'.repeat(64) }),
      ).rejects.toThrow(InvalidSequenceError)
    })

    it('accepts full day sequence ARRIVAL → BREAK_START → BREAK_END → DEPARTURE', async () => {
      const result1 = await service.processScan('user-1', 'company-1', { token: 'a'.repeat(64) })
      expect(result1.result).toBe('ACCEPTED')
      expect(result1.eventType).toBe('ARRIVAL')

      const nowBs = new Date('2026-06-25T12:00:00.000Z')
      const bsService = new ScanService(
        adapter, qrSessionRepo, scanEventRepo, userRepo, companyRepo,
        { now: () => nowBs, nowISO: () => nowBs.toISOString() },
      )
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'BREAK_START',
        token_hash: hashToken('f'.repeat(64)),
        valid_from: '2026-06-25T11:45:00.000Z',
        valid_until: '2026-06-25T12:15:00.000Z',
        status: 'ACTIVE',
      })
      const result2 = await bsService.processScan('user-1', 'company-1', { token: 'f'.repeat(64) })
      expect(result2.result).toBe('ACCEPTED')
      expect(result2.eventType).toBe('BREAK_START')

      const nowBe = new Date('2026-06-25T13:00:00.000Z')
      const beService = new ScanService(
        adapter, qrSessionRepo, scanEventRepo, userRepo, companyRepo,
        { now: () => nowBe, nowISO: () => nowBe.toISOString() },
      )
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'BREAK_END',
        token_hash: hashToken('g'.repeat(64)),
        valid_from: '2026-06-25T12:45:00.000Z',
        valid_until: '2026-06-25T13:15:00.000Z',
        status: 'ACTIVE',
      })
      const result3 = await beService.processScan('user-1', 'company-1', { token: 'g'.repeat(64) })
      expect(result3.result).toBe('ACCEPTED')
      expect(result3.eventType).toBe('BREAK_END')

      const nowDep = new Date('2026-06-25T17:00:00.000Z')
      const depService = new ScanService(
        adapter, qrSessionRepo, scanEventRepo, userRepo, companyRepo,
        { now: () => nowDep, nowISO: () => nowDep.toISOString() },
      )
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'DEPARTURE',
        token_hash: hashToken('h'.repeat(64)),
        valid_from: '2026-06-25T16:30:00.000Z',
        valid_until: '2026-06-25T17:15:00.000Z',
        status: 'ACTIVE',
      })
      const result4 = await depService.processScan('user-1', 'company-1', { token: 'h'.repeat(64) })
      expect(result4.result).toBe('ACCEPTED')
      expect(result4.eventType).toBe('DEPARTURE')

      const record = await attendanceRepo.findByUserAndDate('user-1', '2026-06-25')
      expect(record).not.toBeNull()
      expect(record!.arrival_at).toBe(fixedNow.toISOString())
      expect(record!.break_start_at).toBe(nowBs.toISOString())
      expect(record!.break_end_at).toBe(nowBe.toISOString())
      expect(record!.departure_at).toBe(nowDep.toISOString())
    })

    it('rejects DEPARTURE without ARRIVAL', async () => {
      await qrSessionRepo.create({
        company_id: 'company-1',
        work_date: '2026-06-25',
        event_type: 'DEPARTURE',
        token_hash: hashToken('i'.repeat(64)),
        valid_from: '2026-06-25T16:30:00.000Z',
        valid_until: '2026-06-25T17:15:00.000Z',
        status: 'ACTIVE',
      })

      expect(
        service.processScan('user-1', 'company-1', { token: 'i'.repeat(64) }),
      ).rejects.toThrow(InvalidSequenceError)
    })
  })
})
