import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { env } from './config/env'
import { ApiError, NotFoundError, formatErrorResponse } from './utils/errors'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

app.get('/api/v1/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  })
})

app.onError((err, c) => {
  console.error('Unexpected error:', err)
  
  if (err instanceof ApiError) {
    return c.json(formatErrorResponse(err), err.status as ContentfulStatusCode)
  }
  
  return c.json(
    formatErrorResponse(err),
    500 as ContentfulStatusCode
  )
})

app.notFound((c) => {
  return c.json(
    formatErrorResponse(new NotFoundError()),
    404 as ContentfulStatusCode
  )
})

export default {
  port: env.PORT,
  fetch: app.fetch,
}
