import type { CompanyRepository } from '../../database/repositories/contracts/company.repository'
import type { ScheduleRepository } from '../../database/repositories/contracts/schedule.repository'
import type { ScheduleResponse, UpdateScheduleDTO } from './schedules.types'
import { toScheduleResponse } from './schedules.types'
import { ScheduleNotFoundError, CompanySuspendedForScheduleError } from './schedules.errors'

export class SchedulesService {
  constructor(
    private companyRepo: CompanyRepository,
    private scheduleRepo: ScheduleRepository,
  ) {}

  async getSchedule(companyId: string): Promise<ScheduleResponse> {
    const schedule = await this.scheduleRepo.findByCompanyId(companyId)
    if (!schedule) throw new ScheduleNotFoundError()

    const days = await this.scheduleRepo.findDaysByScheduleId(schedule.id)
    return toScheduleResponse(schedule, days)
  }

  async upsertSchedule(companyId: string, dto: UpdateScheduleDTO): Promise<ScheduleResponse> {
    const company = await this.companyRepo.findById(companyId)
    if (!company) throw new ScheduleNotFoundError()
    if (company.status === 'SUSPENDED') throw new CompanySuspendedForScheduleError()

    const schedule = await this.scheduleRepo.upsert(companyId, {
      start_time: dto.startTime,
      break_start_time: dto.breakStartTime,
      break_end_time: dto.breakEndTime,
      end_time: dto.endTime,
      late_tolerance_minutes: dto.lateToleranceMinutes,
    })

    const days = await this.scheduleRepo.upsertDays(schedule.id, dto.weekdays)
    return toScheduleResponse(schedule, days)
  }
}
