import { z } from 'zod'

export const registerCompanySchema = z.object({
  companyName: z.string().min(1).max(100),
  companyCode: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Must be uppercase alphanumeric with underscores'),
  timezone: z.string().optional().default('UTC'),
  adminFirstName: z.string().min(1).max(50),
  adminLastName: z.string().min(1).max(50),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(128),
})

export const registerEmployeeSchema = z.object({
  companyCode: z.string().min(1).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
