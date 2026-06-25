import { describe, it, expect, beforeEach } from 'bun:test'
import { SqliteAdapter } from '../../database/adapters/sqlite.adapter'
import { createTestDb } from '../../database/test-utils'
import { SqliteCompanyRepository } from '../../database/repositories/sqlite/sqlite-company.repository'
import { SqliteScheduleRepository } from '../../database/repositories/sqlite/sqlite-schedule.repository'
import { SchedulesService } from './schedules.service'

describe('SchedulesService', () => {
  let adapter: SqliteAdapter
  let companyRepo: SqliteCompanyRepository
  let scheduleRepo: SqliteScheduleRepository
  let schedulesService: SchedulesService
  let companyId: string

  beforeEach(() => {
    adapter = createTestDb()
    companyRepo = new SqliteCompanyRepository(adapter)
    scheduleRepo = new SqliteScheduleRepository(adapter)
    schedulesService = new SchedulesService(companyRepo, scheduleRepo)
  })

  describe('getSchedule', () => {
    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id
    })

    it('returns schedule for company with schedule', async () => {
      await scheduleRepo.upsert(companyId, {
        start_time: '09:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        end_time: '18:00',
        late_tolerance_minutes: 10,
      })

      const schedule = await scheduleRepo.findByCompanyId(companyId)
      await scheduleRepo.upsertDays(schedule!.id, [1, 2, 3, 4, 5])

      const result = await schedulesService.getSchedule(companyId)

      expect(result.companyId).toBe(companyId)
      expect(result.startTime).toBe('09:00')
      expect(result.breakStartTime).toBe('12:00')
      expect(result.breakEndTime).toBe('13:00')
      expect(result.endTime).toBe('18:00')
      expect(result.lateToleranceMinutes).toBe(10)
      expect(result.weekdays).toEqual([1, 2, 3, 4, 5])
    })

    it('throws for company without schedule', async () => {
      expect(
        schedulesService.getSchedule(companyId),
      ).rejects.toThrow('Work schedule not found')
    })

    it('throws for non-existent company', async () => {
      expect(
        schedulesService.getSchedule('non-existent-id'),
      ).rejects.toThrow('Work schedule not found')
    })
  })

  describe('upsertSchedule', () => {
    beforeEach(async () => {
      const company = await companyRepo.create({
        id: 'test-company-id',
        name: 'Test Corp',
        company_code: 'TEST01',
        timezone: 'UTC',
        status: 'ACTIVE',
      })
      companyId = company.id
    })

    it('creates schedule when none exists', async () => {
      const result = await schedulesService.upsertSchedule(companyId, {
        startTime: '09:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        endTime: '18:00',
        lateToleranceMinutes: 10,
        weekdays: [1, 2, 3, 4, 5],
      })

      expect(result.companyId).toBe(companyId)
      expect(result.startTime).toBe('09:00')
      expect(result.weekdays).toEqual([1, 2, 3, 4, 5])
    })

    it('updates existing schedule', async () => {
      await schedulesService.upsertSchedule(companyId, {
        startTime: '09:00',
        breakStartTime: null,
        breakEndTime: null,
        endTime: '17:00',
        lateToleranceMinutes: 5,
        weekdays: [1, 2, 3, 4, 5],
      })

      const updated = await schedulesService.upsertSchedule(companyId, {
        startTime: '08:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        endTime: '18:00',
        lateToleranceMinutes: 15,
        weekdays: [1, 2, 3, 4, 5, 6],
      })

      expect(updated.startTime).toBe('08:00')
      expect(updated.breakStartTime).toBe('12:00')
      expect(updated.endTime).toBe('18:00')
      expect(updated.lateToleranceMinutes).toBe(15)
      expect(updated.weekdays).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('throws for suspended company', async () => {
      await companyRepo.update(companyId, { status: 'SUSPENDED' })

      expect(
        schedulesService.upsertSchedule(companyId, {
          startTime: '09:00',
          breakStartTime: null,
          breakEndTime: null,
          endTime: '18:00',
          lateToleranceMinutes: 0,
          weekdays: [1, 2, 3, 4, 5],
        }),
      ).rejects.toThrow('suspended')
    })

    it('throws for non-existent company', async () => {
      expect(
        schedulesService.upsertSchedule('non-existent-id', {
          startTime: '09:00',
          breakStartTime: null,
          breakEndTime: null,
          endTime: '18:00',
          lateToleranceMinutes: 0,
          weekdays: [1, 2, 3, 4, 5],
        }),
      ).rejects.toThrow('Work schedule not found')
    })
  })
})
