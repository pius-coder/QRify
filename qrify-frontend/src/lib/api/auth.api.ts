import { apiGet, apiPost } from './api-client';
import type {
	User,
	CompanyInfo,
	LoginDTO,
	RegisterCompanyDTO,
	RegisterEmployeeDTO
} from '$lib/types/auth.types';

export async function registerCompany(
	dto: RegisterCompanyDTO
): Promise<{ user: User; company: CompanyInfo }> {
	return apiPost('/auth/register/company', dto);
}

export async function registerEmployee(
	dto: RegisterEmployeeDTO
): Promise<{ user: User; company: CompanyInfo }> {
	return apiPost('/auth/register/employee', dto);
}

export async function login(dto: LoginDTO): Promise<{ user: User }> {
	return apiPost('/auth/login', dto);
}

export async function logout(): Promise<void> {
	await apiPost('/auth/logout');
}

export async function getMe(): Promise<{ user: User }> {
	return apiGet('/auth/me');
}
