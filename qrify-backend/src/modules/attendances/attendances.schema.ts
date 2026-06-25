import { z } from 'zod'

export const listAttendancesQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'INCOMPLETE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})
