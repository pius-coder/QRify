import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class ApiError extends HTTPException {
  public readonly code: string
  public readonly fields?: Record<string, string>

  constructor(
    status: ContentfulStatusCode,
    code: string,
    message: string,
    fields?: Record<string, string>
  ) {
    super(status, { message })
    this.code = code
    this.fields = fields
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', fields?: Record<string, string>) {
    super(400, 'BAD_REQUEST', message, fields)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found') {
    super(404, 'NOT_FOUND', message)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(409, 'CONFLICT', message)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', fields?: Record<string, string>) {
    super(422, 'VALIDATION_ERROR', message, fields)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_SERVER_ERROR', message)
  }
}

export function formatErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields && { fields: error.fields }),
      },
    }
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  }
}
