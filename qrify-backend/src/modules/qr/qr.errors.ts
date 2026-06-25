import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors'

export class CompanyNotActiveError extends ForbiddenError {
  constructor() {
    super('Company account is not active')
  }
}

export class NoScheduleError extends NotFoundError {
  constructor() {
    super('Work schedule not configured for this company')
  }
}

export class NotWorkingDayError extends BadRequestError {
  constructor() {
    super('Today is not a working day')
  }
}

export class NoActiveQrError extends NotFoundError {
  constructor() {
    super('No active QR code at this time')
  }
}

export class CompanyCodeNotFoundError extends NotFoundError {
  constructor() {
    super('Company code not found')
  }
}
