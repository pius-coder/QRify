import { z } from 'zod'
import { ValidationError } from './errors'

export async function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): Promise<T> {
  const result = await schema.safeParseAsync(data)
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (path && !fields[path]) {
        fields[path] = issue.message
      }
    }
    throw new ValidationError('Validation failed', fields)
  }
  return result.data
}
