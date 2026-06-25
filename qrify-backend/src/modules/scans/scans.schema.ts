import { z } from 'zod'

export const submitScanSchema = z.object({
  token: z.string().length(64, 'Token must be 64 hex characters'),
})
