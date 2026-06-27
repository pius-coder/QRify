import { NotFoundError } from '../../utils/errors'

export class MeNotFoundError extends NotFoundError {
  constructor(message = 'Record not found') {
    super(message)
  }
}
