import { ForbiddenError, NotFoundError } from '../../utils/errors'

export class ScheduleNotFoundError extends NotFoundError {
  constructor() {
    super('Work schedule not found for this company')
  }
}

export class CompanySuspendedForScheduleError extends ForbiddenError {
  constructor() {
    super('Company account is suspended and cannot modify schedule')
  }
}
