import type { UserData } from '../../database/repositories/contracts/user.repository'

export interface EmployeeResponse {
  id: string
  companyId: string | null
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface UpdateEmployeeDTO {
  firstName?: string
  lastName?: string
  email?: string
}

export interface UpdateEmployeeStatusDTO {
  status: string
}

export function toEmployeeResponse(user: UserData): EmployeeResponse {
  return {
    id: user.id,
    companyId: user.company_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}
