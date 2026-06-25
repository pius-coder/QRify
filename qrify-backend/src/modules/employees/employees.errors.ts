import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors'

export class EmployeeNotFoundError extends NotFoundError {
  constructor(message = 'Employee not found') {
    super(message)
  }
}

export class EmployeeNotInCompanyError extends BadRequestError {
  constructor(message = 'Employee does not belong to this company') {
    super(message)
  }
}

export class InvalidStatusTransitionError extends BadRequestError {
  constructor(message = 'Invalid status transition') {
    super(message)
  }
}

export class CannotModifyCompanyAdminError extends ForbiddenError {
  constructor(message = 'Cannot modify a company administrator') {
    super(message)
  }
}
