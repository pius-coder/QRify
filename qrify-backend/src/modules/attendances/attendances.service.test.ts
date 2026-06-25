import { describe, it, expect, beforeEach } from 'bun:test'
import type { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { AttendanceService } from './attendances.service'
import { AttendanceNotFoundError, AttendanceNotInCompanyError } from './attendances.errors'

describe('AttendanceService', () => {
  let adapter: SqliteAdapter
  let attendanceRepo: SqliteAttendanceRepository
  let scheduleRepo: SqliteScheduleRepository
  let companyRepo: SqliteCompanyRepository
  let scanEventRepo: SqliteScanEventRepository
  let userRepo: SqliteUserRepository
  let service: AttendanceService

  const fixedNow = new Date('2026-06-25T08:00:00.000Z')

  beforeEach(async () => {
    adapter = createTestDb()
    attendanceRepo = new SqliteAttendanceRepository(adapter)
    scheduleRepo = new SqliteScheduleRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)
    scanEventRepo = new SqliteScanEventRepository(adapter)
    userRepo = new SqliteUserRepository(adapter)

    service = new AttendanceService(
      attendanceRepo,
      scheduleRepo,
      companyRepo,
      scanEventRepo,
      userRepo,
      { now: () => fixedNow, nowISO: () => fixedNow.toISOString() },
    )

    await companyRepo.create({
      id: 'company-1',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })

    await companyRepo.create({
      id: 'company-2',
      name: 'Other Corp',
      company_code: 'OTHER01',
      timezone: 'America/New_York',
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

    await userRepo.create({
      id: 'user-2',
      company_id: 'company-1',
      first_name: 'Bob',
      last_name: 'Dupont',
      email: 'bob@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })
  })

  describe('calculate', () => {
    it('calculates no lateness when arriving on time', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.lateMinutes).toBe(0)
      expect(result.status).toBe('PRESENT')
    })

    it('calculates lateness when arriving late', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:20:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.lateMinutes).toBe(5)
      expect(result.status).toBe('LATE')
    })

    it('clamps lateness to zero when arriving before threshold', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:05:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.lateMinutes).toBe(0)
      expect(result.status).toBe('PRESENT')
    })

    it('calculates break time with complete pair', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: '2026-06-25T12:00:00.000Z',
        break_end_at: '2026-06-25T13:00:00.000Z',
        departure_at: '2026-06-25T18:00:00.000Z',
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.breakMinutes).toBe(60)
      expect(result.workedMinutes).toBe(8 * 60)
      expect(result.status).toBe('PRESENT')
    })

    it('sets INCOMPLETE when only one break event exists', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: '2026-06-25T12:00:00.000Z',
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.status).toBe('INCOMPLETE')
      expect(result.breakMinutes).toBe(0)
    })

    it('calculates overtime', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: '2026-06-25T19:00:00.000Z',
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.overtimeMinutes).toBe(60)
      expect(result.workedMinutes).toBe(10 * 60)
    })

    it('clamps overtime to zero', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: '2026-06-25T17:00:00.000Z',
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.overtimeMinutes).toBe(0)
    })

    it('handles timezone conversion for non-UTC timezone', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-2',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T13:20:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-2', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const result = await service.calculate(record.id)
      expect(result.lateMinutes).toBe(5)
    })

    it('throws AttendanceNotFoundError for missing record', async () => {
      expect(service.calculate('nonexistent')).rejects.toThrow(AttendanceNotFoundError)
    })
  })

  describe('list', () => {
    beforeEach(async () => {
      await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-2',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:30:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'LATE',
        late_minutes: 15,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })
    })

    it('returns all attendances for a company and date', async () => {
      const result = await service.list('company-1', { date: '2026-06-25' })
      expect(result.attendances).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    it('filters by status', async () => {
      const result = await service.list('company-1', { date: '2026-06-25', status: 'LATE' })
      expect(result.attendances).toHaveLength(1)
      expect(result.attendances[0]!.status).toBe('LATE')
    })

    it('paginates results', async () => {
      const result = await service.list('company-1', { date: '2026-06-25', page: 1, limit: 1 })
      expect(result.attendances).toHaveLength(1)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
    })
  })

  describe('getById', () => {
    it('returns attendance detail with scan events', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scanEventRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        qr_session_id: null,
        event_type: 'ARRIVAL',
        scanned_at: '2026-06-25T09:00:00.000Z',
        result: 'ACCEPTED',
      })

      const result = await service.getById('company-1', record.id)
      expect(result.id).toBe(record.id)
      expect(result.events).toHaveLength(1)
      expect(result.events[0]!.eventType).toBe('ARRIVAL')
    })

    it('throws AttendanceNotFoundError for missing record', async () => {
      expect(service.getById('company-1', 'nonexistent')).rejects.toThrow(AttendanceNotFoundError)
    })

    it('throws AttendanceNotInCompanyError for wrong company', async () => {
      const record = await attendanceRepo.create({
        company_id: 'company-2',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      expect(service.getById('company-1', record.id)).rejects.toThrow(AttendanceNotInCompanyError)
    })
  })

  describe('runAbsenceDetection', () => {
    it('marks absent employees for active companies on working days', async () => {
      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [4, 5])

      const count = await service.runAbsenceDetection()
      expect(count).toBe(2)
    })

    it('accepts an explicit date parameter', async () => {
      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [4, 5])

      const count = await service.runAbsenceDetection('2026-06-25')
      expect(count).toBe(2)
    })

    it('returns zero for non-working day', async () => {
      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [1])

      const count = await service.runAbsenceDetection('2026-06-25')
      expect(count).toBe(0)
    })

    it('is idempotent on second run', async () => {
      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [4, 5])

      const first = await service.runAbsenceDetection('2026-06-25')
      const second = await service.runAbsenceDetection('2026-06-25')
      expect(first).toBe(2)
      expect(second).toBe(0)
    })
  })

  describe('detectAbsencesForCompany', () => {
    it('creates ABSENT records for active employees without arrival', async () => {
      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [4, 5])

      const count = await service.detectAbsencesForCompany('company-1', '2026-06-25')
      expect(count).toBe(2)

      const records = await attendanceRepo.findByCompanyAndDate('company-1', '2026-06-25')
      expect(records).toHaveLength(2)
      expect(records[0]!.status).toBe('ABSENT')
      expect(records[1]!.status).toBe('ABSENT')
    })

    it('skips employees who already have arrival', async () => {
      await attendanceRepo.create({
        company_id: 'company-1',
        user_id: 'user-1',
        work_date: '2026-06-25',
        arrival_at: '2026-06-25T09:00:00.000Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'PRESENT',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      await scheduleRepo.upsert('company-1', {
        start_time: '09:00',
        break_start_time: null,
        break_end_time: null,
        end_time: '18:00',
        late_tolerance_minutes: 15,
      })

      const schedule = await scheduleRepo.findByCompanyId('company-1')
      await scheduleRepo.upsertDays(schedule!.id, [4, 5])

      const count = await service.detectAbsencesForCompany('company-1', '2026-06-25')
      expect(count).toBe(1)

      const records = await attendanceRepo.findByCompanyAndDate('company-1', '2026-06-25')
      expect(records).toHaveLength(2)
      const presentUser = records.find((r) => r.user_id === 'user-1')
      expect(presentUser!.status).toBe('PRESENT')
    })

    it('returns zero for inactive company', async () => {
      const count = await service.detectAbsencesForCompany('nonexistent', '2026-06-25')
      expect(count).toBe(0)
    })
  })
})
