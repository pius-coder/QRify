import { ConflictError, UnauthorizedError, ForbiddenError, BadRequestError } from '../../utils/errors'

export class EmailAlreadyExistsError extends ConflictError {
  constructor() {
    super('A user with this email already exists')
  }
}

export class CompanyCodeAlreadyExistsError extends ConflictError {
  constructor() {
    super('This company code is already taken')
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password')
  }
}

export class AccountPendingError extends ForbiddenError {
  constructor() {
    super('Account is pending approval. Please wait for an administrator to activate your account.')
  }
}

export class AccountRejectedError extends ForbiddenError {
  constructor() {
    super('Account has been rejected. Contact your administrator for details.')
  }
}

export class AccountSuspendedError extends ForbiddenError {
  constructor() {
    super('Account is suspended. Contact your administrator for details.')
  }
}

export class CompanyNotFoundError extends BadRequestError {
  constructor() {
    super('Company not found with the provided code')
  }
}

export class CompanySuspendedError extends ForbiddenError {
  constructor() {
    super('Company account is suspended')
  }
}
