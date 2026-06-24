import { ForbiddenError, NotFoundError } from '../../utils/errors'

export class CompanySuspendedError extends ForbiddenError {
  constructor() {
    super('Company account is suspended and cannot be modified')
  }
}

export class CompanyProfileNotFoundError extends NotFoundError {
  constructor() {
    super('Company profile not found')
  }
}
