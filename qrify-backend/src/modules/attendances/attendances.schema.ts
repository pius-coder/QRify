import { z } from 'zod'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const listAttendancesQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'INCOMPLETE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const triggerAbsenceDetectionSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
})
