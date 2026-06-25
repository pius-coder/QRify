import { BadRequestError, ForbiddenError, ConflictError } from '../../utils/errors'

export class InvalidTokenError extends BadRequestError {
  constructor() {
    super('Invalid or unrecognized token')
  }
}

export class ExpiredTokenError extends BadRequestError {
  constructor() {
    super('QR code has expired')
  }
}

export class WrongCompanyError extends ForbiddenError {
  constructor() {
    super('This QR code belongs to a different company')
  }
}

export class UserNotActiveError extends ForbiddenError {
  constructor() {
    super('User account is not active')
  }
}

export class CompanySuspendedError extends ForbiddenError {
  constructor() {
    super('Company account is suspended')
  }
}

export class DuplicateScanError extends ConflictError {
  constructor(eventType: string) {
    super(`Scan already recorded for ${eventType}`)
  }
}

export class InvalidSequenceError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}
