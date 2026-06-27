import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteAttendanceRepository } from '../../database/repositories/sqlite/sqlite-attendance.repository'
import { SqliteScanEventRepository } from '../../database/repositories/sqlite/sqlite-scan-event.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { MeService } from './me.service'
import { MeNotFoundError } from './me.errors'

describe('MeService', () => {
  let adapter: SqliteAdapter
  let attendanceRepo: SqliteAttendanceRepository
  let scanEventRepo: SqliteScanEventRepository
  let userRepo: SqliteUserRepository
  let companyRepo: SqliteCompanyRepository
  let service: MeService
  let userId: string
  let companyId: string
  let today: string

  beforeEach(async () => {
    adapter = createTestDb()
    attendanceRepo = new SqliteAttendanceRepository(adapter)
    scanEventRepo = new SqliteScanEventRepository(adapter)
    userRepo = new SqliteUserRepository(adapter)
    companyRepo = new SqliteCompanyRepository(adapter)
    service = new MeService(attendanceRepo, scanEventRepo, userRepo)

    today = new Date().toISOString().split('T')[0] ?? ''

    const company = await companyRepo.create({
      id: 'comp-1',
      name: 'Test Corp',
      company_code: 'TEST01',
      timezone: 'UTC',
      status: 'ACTIVE',
    })
    companyId = company.id

    const user = await userRepo.create({
      id: 'user-1',
      company_id: companyId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password_hash: 'hash',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    })
    userId = user.id
  })

  describe('getTodayAttendance', () => {
    it('returns null attendance when no record exists for today', async () => {
      const result = await service.getTodayAttendance(userId, companyId)

      expect(result.date).toBe(today)
      expect(result.attendance).toBeNull()
      expect(result.scanEvents).toEqual([])
      expect(result.nextExpectedEvent).toBe('ARRIVAL')
    })

    it('returns attendance record when one exists for today', async () => {
      await attendanceRepo.create({
        company_id: companyId,
        user_id: userId,
        work_date: today,
        arrival_at: '2026-06-25T08:00:00Z',
        break_start_at: null,
        break_end_at: null,
        departure_at: null,
        status: 'INCOMPLETE',
        late_minutes: 0,
        break_minutes: 0,
        worked_minutes: 0,
        overtime_minutes: 0,
      })

      const result = await service.getTodayAttendance(userId, companyId)

      expect(result.attendance).not.toBeNull()
      expect(result.attendance!.workDate).toBe(today)
      expect(result.attendance!.status).toBe('INCOMPLETE')
    })

    it('determines next expected event based on accepted scan events', async () => {
      await scanEventRepo.create({
        company_id: companyId,
        user_id: userId,
        qr_session_id: null,
        event_type: 'ARRIVAL',
        scanned_at: new Date().toISOString(),
        result: 'ACCEPTED',
      })

      const result = await service.getTodayAttendance(userId, companyId)

      expect(result.nextExpectedEvent).toBe('BREAK_START')
    })

    it('returns null when all events are completed', async () => {
      const events = ['ARRIVAL', 'BREAK_START', 'BREAK_END', 'DEPARTURE']
      for (const event of events) {
        await scanEventRepo.create({
          company_id: companyId,
          user_id: userId,
          qr_session_id: null,
          event_type: event,
          scanned_at: new Date().toISOString(),
          result: 'ACCEPTED',
        })
      }

      const result = await service.getTodayAttendance(userId, companyId)

      expect(result.nextExpectedEvent).toBeNull()
    })
  })

  describe('getAttendances', () => {
    it('returns all attendance records for the user', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-24',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-25',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })

      const result = await service.getAttendances(userId)

      expect(result.attendances).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('filters by date range when provided', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-01',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-15',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-07-01',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })

      const result = await service.getAttendances(userId, '2026-06-01', '2026-06-30')

      expect(result.attendances).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('returns empty list when no records', async () => {
      const result = await service.getAttendances(userId)
      expect(result.attendances).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('getAttendanceByDate', () => {
    it('returns attendance record and scan events for the date', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-25',
        arrival_at: '2026-06-25T08:00:00Z', break_start_at: null, break_end_at: null, departure_at: null,
        status: 'INCOMPLETE', late_minutes: 0, break_minutes: 0, worked_minutes: 0, overtime_minutes: 0,
      })

      const result = await service.getAttendanceByDate(userId, '2026-06-25')

      expect(result.attendance).not.toBeNull()
      expect(result.attendance!.workDate).toBe('2026-06-25')
      expect(result.scanEvents).toEqual([])
    })

    it('throws MeNotFoundError when no record exists', async () => {
      await expect(service.getAttendanceByDate(userId, '2026-06-25')).rejects.toThrow(MeNotFoundError)
    })
  })

  describe('getAttendanceSummary', () => {
    it('calculates summary from all records', async () => {
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-01',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'PRESENT', late_minutes: 0, break_minutes: 0, worked_minutes: 480, overtime_minutes: 0,
      })
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-02',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'LATE', late_minutes: 15, break_minutes: 0, worked_minutes: 465, overtime_minutes: 0,
      })
      await attendanceRepo.create({
        company_id: companyId, user_id: userId, work_date: '2026-06-03',
        arrival_at: null, break_start_at: null, break_end_at: null, departure_at: null,
        status: 'ABSENT', late_minutes: 0, break_minutes: 0, worked_minutes: 0, overtime_minutes: 0,
      })

      const result = await service.getAttendanceSummary(userId)

      expect(result.totalDays).toBe(3)
      expect(result.presentDays).toBe(1)
      expect(result.lateDays).toBe(1)
      expect(result.absentDays).toBe(1)
      expect(result.totalLateMinutes).toBe(15)
      expect(result.totalWorkedMinutes).toBe(945)
      expect(result.totalOvertimeMinutes).toBe(0)
    })

    it('returns zeros when no records', async () => {
      const result = await service.getAttendanceSummary(userId)

      expect(result.totalDays).toBe(0)
      expect(result.presentDays).toBe(0)
      expect(result.lateDays).toBe(0)
      expect(result.absentDays).toBe(0)
      expect(result.totalLateMinutes).toBe(0)
      expect(result.totalWorkedMinutes).toBe(0)
      expect(result.totalOvertimeMinutes).toBe(0)
    })
  })

  describe('updateProfile', () => {
    it('updates firstName and lastName', async () => {
      const result = await service.updateProfile(userId, { firstName: 'Jane', lastName: 'Smith' })

      expect(result.firstName).toBe('Jane')
      expect(result.lastName).toBe('Smith')

      const updated = await userRepo.findById(userId)
      expect(updated!.first_name).toBe('Jane')
      expect(updated!.last_name).toBe('Smith')
    })

    it('updates only firstName when lastName not provided', async () => {
      const result = await service.updateProfile(userId, { firstName: 'Jane' })

      expect(result.firstName).toBe('Jane')
      expect(result.lastName).toBe('Doe')
    })

    it('throws MeNotFoundError for non-existent user', async () => {
      await expect(service.updateProfile('non-existent', { firstName: 'Jane' })).rejects.toThrow(MeNotFoundError)
    })
  })
})
