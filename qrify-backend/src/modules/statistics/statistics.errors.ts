import { BadRequestError } from '../../utils/errors'

export class InvalidPeriodError extends BadRequestError {
  constructor(message = 'Invalid period: start date must be before end date') { super(message) }
}

export class InvalidRankingTypeError extends BadRequestError {
  constructor(type: string) {
    super(`Invalid ranking type: ${type}. Must be one of: assiduity, late, absence`)
  }
}

export class InvalidWeekError extends BadRequestError {
  constructor(message = 'Invalid week parameters') { super(message) }
}

export class CompanyNotActiveForStatsError extends BadRequestError {
  constructor(message = 'Company is not active') { super(message) }
}
