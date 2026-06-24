import type { Context } from 'hono'

export interface JwtPayload {
  sub: string
  role: string
  companyId: string | null
  status: string
  iat?: number
  exp?: number
}

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

export interface RegisterCompanyDTO {
  companyName: string
  companyCode: string
  timezone: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPassword: string
}

export interface RegisterEmployeeDTO {
  companyCode: string
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  companyId: string | null
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
}

export interface AuthResponse {
  user: UserResponse
}
