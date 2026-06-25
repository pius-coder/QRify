import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors'

export class AttendanceNotFoundError extends NotFoundError {
  constructor(message = 'Attendance record not found') {
    super(message)
  }
}

export class AttendanceNotInCompanyError extends BadRequestError {
  constructor(message = 'Attendance record does not belong to this company') {
    super(message)
  }
}

export class CompanyNotActiveError extends BadRequestError {
  constructor(message = 'Company is not active') {
    super(message)
  }
}

export class EmployeeNotActiveError extends BadRequestError {
  constructor(message = 'Employee is not active') {
    super(message)
  }
}

export class NotWorkingDayError extends BadRequestError {
  constructor(message = 'Today is not a working day') {
    super(message)
  }
}
