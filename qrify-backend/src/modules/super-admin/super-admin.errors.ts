import { BadRequestError, NotFoundError } from '../../utils/errors'

export class SuperAdminCompanyNotFoundError extends NotFoundError {
  constructor(message = 'Company not found') { super(message) }
}

export class InvalidCompanyStatusTransitionError extends BadRequestError {
  constructor(currentStatus: string, newStatus: string) {
    super(`Cannot transition company status from ${currentStatus} to ${newStatus}`)
  }
}
