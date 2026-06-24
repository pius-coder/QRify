import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('./data/qrify.sqlite'),
  DB_TYPE: z.enum(['sqlite']).default('sqlite'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
