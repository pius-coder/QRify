import { z } from 'zod'

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().min(1),
})
