import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import type { WorkScheduleData } from '../../database/repositories/contracts/schedule.repository'
import { QrSessionService } from './qr.service'

function makeSchedule(overrides?: Partial<WorkScheduleData>): WorkScheduleData {
  return {
    id: 'test-schedule-id',
    company_id: 'test-company',
    start_time: '08:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
    end_time: '17:00',
    late_tolerance_minutes: 10,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('QrSessionService', () => {
  let adapter: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let scheduleRepo: SqliteScheduleRepository
  let qrSessionRepo: SqliteQrSessionRepository
  let service: QrSessionService

  beforeEach(() => {
    adapter = createTestDb()
    companyRepo = new SqliteCompanyRepository(adapter)
    scheduleRepo = new SqliteScheduleRepository(adapter)
    qrSessionRepo = new SqliteQrSessionRepository(adapter)
    service = new QrSessionService(companyRepo, scheduleRepo, qrSessionRepo, {
      now: () => new Date('2026-06-25T08:00:00Z'),
      nowISO: () => '2026-06-25T08:00:00.000Z',
    })
  })

  describe('determineActiveEventType', () => {
    it('returns ARRIVAL during arrival window', () => {
      const schedule = makeSchedule()
      expect(service.determineActiveEventType(schedule, '07:30')).toBe('ARRIVAL')
      expect(service.determineActiveEventType(schedule, '08:00')).toBe('ARRIVAL')
      expect(service.determineActiveEventType(schedule, '08:29')).toBe('ARRIVAL')
    })

    it('returns BREAK_START during break start window', () => {
      const schedule = makeSchedule()
      expect(service.determineActiveEventType(schedule, '11:45')).toBe('BREAK_START')
      expect(service.determineActiveEventType(schedule, '12:00')).toBe('BREAK_START')
      expect(service.determineActiveEventType(schedule, '12:14')).toBe('BREAK_START')
    })

    it('returns BREAK_END during break end window', () => {
      const schedule = makeSchedule()
      expect(service.determineActiveEventType(schedule, '12:45')).toBe('BREAK_END')
      expect(service.determineActiveEventType(schedule, '13:00')).toBe('BREAK_END')
      expect(service.determineActiveEventType(schedule, '13:14')).toBe('BREAK_END')
    })

    it('returns DEPARTURE during departure window', () => {
      const schedule = makeSchedule()
      expect(service.determineActiveEventType(schedule, '16:30')).toBe('DEPARTURE')
      expect(service.determineActiveEventType(schedule, '17:00')).toBe('DEPARTURE')
      expect(service.determineActiveEventType(schedule, '17:14')).toBe('DEPARTURE')
    })

    it('returns null outside any window', () => {
      const schedule = makeSchedule()
      expect(service.determineActiveEventType(schedule, '06:00')).toBeNull()
      expect(service.determineActiveEventType(schedule, '09:00')).toBeNull()
      expect(service.determineActiveEventType(schedule, '14:00')).toBeNull()
      expect(service.determineActiveEventType(schedule, '20:00')).toBeNull()
    })

    it('skips break windows when break is not configured', () => {
      const schedule = makeSchedule({ break_start_time: null, break_end_time: null })
      expect(service.determineActiveEventType(schedule, '12:00')).toBeNull()
    })

    it('returns ARRIVAL before BREAK_START when windows overlap', () => {
      const schedule = makeSchedule({ start_time: '07:00', break_start_time: '07:30' })
      expect(service.determineActiveEventType(schedule, '07:15')).toBe('ARRIVAL')
    })
  })

  describe('getOrCreateActiveSession', () => {
    let companyId: string
    let scheduleId: string

    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id

      const schedule = await scheduleRepo.upsert(companyId, {
        start_time: '08:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '17:00',
        late_tolerance_minutes: 10,
      })
      scheduleId = schedule.id

      await scheduleRepo.upsertDays(scheduleId, [4, 5])
    })

    it('creates and returns an active QR session during arrival window', async () => {
      const result = await service.getOrCreateActiveSession(companyId)

      expect(result.eventType).toBe('ARRIVAL')
      expect(result.companyId).toBe(companyId)
      expect(result.companyName).toBe('Test Corp')
      expect(result.token).toBeTruthy()
      expect(result.workDate).toBe('2026-06-25')
      expect(result.validFrom).toBeTruthy()
      expect(result.validUntil).toBeTruthy()
      expect(result.sessionId).toBeTruthy()
    })

    it('creates a new session each time (expires old one)', async () => {
      const first = await service.getOrCreateActiveSession(companyId)
      const second = await service.getOrCreateActiveSession(companyId)

      expect(second.token).not.toBe(first.token)
    })

    it('throws for non-existent company', async () => {
      expect(
        service.getOrCreateActiveSession('non-existent'),
      ).rejects.toThrow('Company code not found')
    })

    it('throws for suspended company', async () => {
      await companyRepo.update(companyId, { status: 'SUSPENDED' })

      expect(
        service.getOrCreateActiveSession(companyId),
      ).rejects.toThrow('not active')
    })

    it('throws when no schedule exists', async () => {
      const newCompany = await companyRepo.create({
        id: 'no-schedule-company',
        name: 'No Schedule',
        company_code: 'NOSCHED',
        timezone: 'UTC',
        status: 'ACTIVE',
      })

      expect(
        service.getOrCreateActiveSession(newCompany.id),
      ).rejects.toThrow('Work schedule not configured')
    })

    it('throws for non-working day', async () => {
      // 2026-06-25 is Thursday (weekday 4), working days are [4,5]
      // This should work. To test non-working, use service with different clock day
      const weekendService = new QrSessionService(companyRepo, scheduleRepo, qrSessionRepo, {
        now: () => new Date('2026-06-27T08:00:00Z'),
        nowISO: () => '2026-06-27T08:00:00.000Z',
      })

      // 2026-06-27 is Saturday (weekday 6), not in [4,5]
      expect(
        weekendService.getOrCreateActiveSession(companyId),
      ).rejects.toThrow('not a working day')
    })
  })

  describe('getActiveQrByCompanyCode', () => {
    beforeEach(async () => {
      await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      const schedule = await scheduleRepo.upsert('test-company-id', {
        start_time: '08:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '17:00',
        late_tolerance_minutes: 10,
      })
      await scheduleRepo.upsertDays(schedule.id, [4, 5])
    })

    it('returns active QR for valid company code', async () => {
      const result = await service.getActiveQrByCompanyCode('TEST01')
      expect(result.companyId).toBe('test-company-id')
      expect(result.companyName).toBe('Test Corp')
      expect(result.eventType).toBe('ARRIVAL')
      expect(result.token).toBeTruthy()
    })

    it('throws for invalid company code', async () => {
      expect(
        service.getActiveQrByCompanyCode('INVALID'),
      ).rejects.toThrow('Company code not found')
    })
  })

  describe('toMinutes', () => {
    it('converts HH:MM to minutes since midnight', () => {
      expect((service as unknown as { toMinutes: (t: string) => number }).toMinutes('00:00')).toBe(0)
      expect((service as unknown as { toMinutes: (t: string) => number }).toMinutes('08:00')).toBe(480)
      expect((service as unknown as { toMinutes: (t: string) => number }).toMinutes('12:30')).toBe(750)
      expect((service as unknown as { toMinutes: (t: string) => number }).toMinutes('23:59')).toBe(1439)
    })
  })

  describe('generateToken', () => {
    it('generates a raw token and its SHA-256 hash', () => {
      const result = (service as unknown as { generateToken: () => { raw: string; hash: string } }).generateToken()
      expect(result.raw).toBeTruthy()
      expect(result.raw.length).toBe(64)
      expect(result.hash).toBeTruthy()
      expect(result.hash.length).toBe(64)
      expect(result.raw).not.toBe(result.hash)
    })
  })
})
