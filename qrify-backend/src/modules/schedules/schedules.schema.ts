import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const timeSchema = z
  .string()
  .regex(timeRegex, 'Time must be in HH:MM format (24h)')

function toMinutes(t: string): number {
  const parts = t.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  return h * 60 + m
}

export const updateScheduleSchema = z
  .object({
    startTime: timeSchema,
    breakStartTime: timeSchema.nullable(),
    breakEndTime: timeSchema.nullable(),
    endTime: timeSchema,
    lateToleranceMinutes: z.number().int().min(0),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'At least one working day is required')
      .refine(
        (arr) => new Set(arr).size === arr.length,
        'Weekdays must be unique',
      ),
  })
  .refine(
    (data) => {
      const start = toMinutes(data.startTime)
      const end = toMinutes(data.endTime)
      return start < end
    },
    { message: 'Start time must be before end time', path: ['startTime'] },
  )
  .refine(
    (data) => {
      if (data.breakStartTime === null && data.breakEndTime === null) return true
      if (data.breakStartTime !== null && data.breakEndTime !== null) {
        const start = toMinutes(data.startTime)
        const breakStart = toMinutes(data.breakStartTime)
        const breakEnd = toMinutes(data.breakEndTime)
        const end = toMinutes(data.endTime)
        return start < breakStart && breakStart < breakEnd && breakEnd < end
      }
      return false
    },
    {
      message:
        'Break start and end must both be provided or both be null, and must be between start and end times',
      path: ['breakStartTime'],
    },
  )
