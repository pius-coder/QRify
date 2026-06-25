import { z } from 'zod'

const STATUS_VALUES = ['ACTIVE', 'SUSPENDED'] as const

export const updateCompanyStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
})

export const listCompaniesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
