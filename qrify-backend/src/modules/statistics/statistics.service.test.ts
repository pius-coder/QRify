import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteStatisticsRepository } from '../../database/repositories/sqlite/sqlite-statistics.repository'
import { SqliteQrSessionRepository } from '../../database/repositories/sqlite/sqlite-qr-session.repository'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteUserRepository } from '../../database/repositories/sqlite/sqlite-user.repository'
import { StatisticsService } from './statistics.service'
import { InvalidPeriodError, InvalidRankingTypeError, InvalidWeekError } from './statistics.errors'

describe('StatisticsService', () => {
  let adapter: SqliteAdapter
  let statsRepo: SqliteStatisticsRepository
  let qrSessionRepo: SqliteQrSessionRepository
  let service: StatisticsService

  beforeEach(() => {
    adapter = createTestDb()
    statsRepo = new SqliteStatisticsRepository(adapter)
    qrSessionRepo = new SqliteQrSessionRepository(adapter)
    service = new StatisticsService(statsRepo, qrSessionRepo)
  })

  describe('getDashboard', () => {
    beforeEach(async () => {
      const companyRepo = new SqliteCompanyRepository(adapter)
      const userRepo = new SqliteUserRepository(adapter)

      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-1', company_id: 'comp-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-2', company_id: 'comp-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-3', company_id: 'comp-1', first_name: 'Charlie', last_name: 'Brown', email: 'charlie@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'PENDING' })
    })

    it('returns dashboard with zero counts when no attendance records', async () => {
      const result = await service.getDashboard('comp-1')
      expect(result.activeEmployees).toBe(2)
      expect(result.presentToday).toBe(0)
      expect(result.lateToday).toBe(0)
      expect(result.absentToday).toBe(0)
      expect(result.incompletePresences).toBe(0)
      expect(result.activeQr).toBe(false)
      expect(result.lastScans).toHaveLength(0)
    })

    it('includes today attendance data', async () => {
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, arrival_at, status, late_minutes, break_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, date('now'), datetime('now'), ?, 0, 0, 0, 0)",
        ['ar-1', 'comp-1', 'user-1', 'PRESENT']
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, arrival_at, status, late_minutes, break_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, date('now'), datetime('now'), ?, 10, 0, 0, 0)",
        ['ar-2', 'comp-1', 'user-2', 'LATE']
      )

      const result = await service.getDashboard('comp-1')
      expect(result.presentToday).toBe(1)
      expect(result.lateToday).toBe(1)
    })

    it('detects incomplete presences (arrival without departure)', async () => {
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, arrival_at, departure_at, status, late_minutes, break_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, date('now'), datetime('now'), NULL, 'PRESENT', 0, 0, 0, 0)",
        ['ar-1', 'comp-1', 'user-1']
      )

      const result = await service.getDashboard('comp-1')
      expect(result.incompletePresences).toBe(1)
    })
  })

  describe('getAttendance', () => {
    beforeEach(async () => {
      const companyRepo = new SqliteCompanyRepository(adapter)
      const userRepo = new SqliteUserRepository(adapter)

      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-1', company_id: 'comp-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-2', company_id: 'comp-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })

      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['ar-1', 'comp-1', 'user-1', '2025-01-01', 'PRESENT', 0, 30]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['ar-2', 'comp-1', 'user-2', '2025-01-01', 'LATE', 15, 0]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['ar-3', 'comp-1', 'user-1', '2025-01-02', 'ABSENT', 0, 0]
      )
    })

    it('returns period stats with attendance rate and totals', async () => {
      const result = await service.getAttendance('comp-1', '2025-01-01', '2025-01-02')
      expect(result.lateCount).toBe(1)
      expect(result.absenceCount).toBe(1)
      expect(result.overtimeTotal).toBe(30)
      expect(result.attendanceRate).toBeCloseTo(66.67, 0)
    })

    it('returns daily chart data grouped by date', async () => {
      const result = await service.getAttendance('comp-1', '2025-01-01', '2025-01-02')
      expect(result.dailyChart).toHaveLength(2)
      expect(result.dailyChart[0]!.workDate).toBe('2025-01-01')
      expect(result.dailyChart[1]!.workDate).toBe('2025-01-02')
    })

    it('throws InvalidPeriodError when startDate is after endDate', async () => {
      expect(service.getAttendance('comp-1', '2025-02-01', '2025-01-01')).rejects.toThrow(InvalidPeriodError)
    })
  })

  describe('getRankings', () => {
    beforeEach(async () => {
      const companyRepo = new SqliteCompanyRepository(adapter)
      const userRepo = new SqliteUserRepository(adapter)

      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-1', company_id: 'comp-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-2', company_id: 'comp-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })

      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes, worked_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-1', 'comp-1', 'user-1', '2025-01-01', 'PRESENT', 0, 0, 480]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes, worked_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-2', 'comp-1', 'user-2', '2025-01-01', 'LATE', 20, 0, 480]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, overtime_minutes, worked_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-3', 'comp-1', 'user-1', '2025-01-02', 'ABSENT', 0, 0, 0]
      )
    })

    it('returns assiduity rankings', async () => {
      const result = await service.getRankings('comp-1', 'assiduity', '2025-01-01', '2025-01-02')
      expect(result.type).toBe('assiduity')
      expect(result.rankings).toHaveLength(2)
      expect(result.rankings[0]!.userId).toBe('user-2')
      expect(result.rankings[0]!.value).toBe(100)
      expect(result.rankings[1]!.userId).toBe('user-1')
      expect(result.rankings[1]!.value).toBe(50)
    })

    it('returns late rankings sorted descending', async () => {
      const result = await service.getRankings('comp-1', 'late', '2025-01-01', '2025-01-02')
      expect(result.type).toBe('late')
      expect(result.rankings).toHaveLength(1)
      expect(result.rankings[0]!.userId).toBe('user-2')
      expect(result.rankings[0]!.value).toBe(20)
    })

    it('returns absence rankings', async () => {
      const result = await service.getRankings('comp-1', 'absence', '2025-01-01', '2025-01-02')
      expect(result.type).toBe('absence')
      expect(result.rankings).toHaveLength(1)
      expect(result.rankings[0]!.userId).toBe('user-1')
      expect(result.rankings[0]!.value).toBe(1)
    })

    it('throws InvalidRankingTypeError for unknown type', async () => {
      expect(service.getRankings('comp-1', 'invalid', '2025-01-01', '2025-01-02')).rejects.toThrow(InvalidRankingTypeError)
    })

    it('throws InvalidPeriodError for invalid date range', async () => {
      expect(service.getRankings('comp-1', 'assiduity', '2025-02-01', '2025-01-01')).rejects.toThrow(InvalidPeriodError)
    })
  })

  describe('getWeeklyReport', () => {
    beforeEach(async () => {
      const companyRepo = new SqliteCompanyRepository(adapter)
      const userRepo = new SqliteUserRepository(adapter)

      await companyRepo.create({ id: 'comp-1', name: 'Test Corp', company_code: 'TEST01', timezone: 'UTC', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-1', company_id: 'comp-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })
      await userRepo.create({ id: 'user-2', company_id: 'comp-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', password_hash: 'hash', role: 'EMPLOYEE', status: 'ACTIVE' })

      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-1', 'comp-1', 'user-1', '2025-01-06', 'PRESENT', 0, 480, 30]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-2', 'comp-1', 'user-1', '2025-01-07', 'LATE', 10, 470, 0]
      )
      adapter.run(
        "INSERT INTO attendance_records (id, company_id, user_id, work_date, status, late_minutes, worked_minutes, overtime_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['ar-3', 'comp-1', 'user-2', '2025-01-06', 'PRESENT', 0, 480, 60]
      )
    })

    it('returns weekly report with per-employee breakdown', async () => {
      const result = await service.getWeeklyReport('comp-1', 2025, 1)
      expect(result.year).toBe(2025)
      expect(result.week).toBe(1)
      expect(result.entries).toHaveLength(2)

      const alice = result.entries.find(e => e.userId === 'user-1')
      const bob = result.entries.find(e => e.userId === 'user-2')

      expect(alice).toBeDefined()
      expect(alice!.daysPresent).toBe(1)
      expect(alice!.daysLate).toBe(1)
      expect(alice!.lateMinutes).toBe(10)
      expect(alice!.workedMinutes).toBe(950)
      expect(alice!.overtimeMinutes).toBe(30)

      expect(bob).toBeDefined()
      expect(bob!.daysPresent).toBe(1)
      expect(bob!.overtimeMinutes).toBe(60)
    })

    it('throws InvalidWeekError for week out of range', async () => {
      expect(service.getWeeklyReport('comp-1', 2025, 0)).rejects.toThrow(InvalidWeekError)
      expect(service.getWeeklyReport('comp-1', 2025, 54)).rejects.toThrow(InvalidWeekError)
    })
  })
})
