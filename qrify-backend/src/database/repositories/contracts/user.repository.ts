export interface UserData {
  id: string
  company_id: string | null
  first_name: string
  last_name: string
  email: string
  password_hash: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export interface UserRepository {
  findById(id: string): Promise<UserData | null>
  findByEmail(email: string): Promise<UserData | null>
  findAllByCompany(companyId: string): Promise<UserData[]>
  create(data: Omit<UserData, 'created_at' | 'updated_at'>): Promise<UserData>
  update(id: string, data: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>): Promise<UserData | null>
  updateStatus(id: string, status: string): Promise<UserData | null>
  existsByEmail(email: string): Promise<boolean>
}
