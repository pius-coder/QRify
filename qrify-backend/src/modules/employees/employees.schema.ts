import { z } from 'zod'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
  REJECTED: [],
}

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
}).refine((data) => data.firstName !== undefined || data.lastName !== undefined || data.email !== undefined, {
  message: 'At least one field must be provided for update',
})

export const updateEmployeeStatusSchema = z.object({
  status: z.string(),
}).refine(
  (data) => {
    return Object.keys(ALLOWED_TRANSITIONS).includes(data.status)
  },
  { message: 'Status must be one of: ACTIVE, SUSPENDED, REJECTED' },
)

export function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus]
  if (!allowed) return false
  return allowed.includes(newStatus)
}
