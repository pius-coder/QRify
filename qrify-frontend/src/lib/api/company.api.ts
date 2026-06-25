import { apiGet, apiPut } from './api-client';
import type {
	CompanyProfile,
	UpdateCompanyDTO,
	CompanyCodeResponse
} from '$lib/types/company.types';

export async function getCompany(): Promise<{ company: CompanyProfile }> {
	return apiGet('/company');
}

export async function updateCompany(dto: UpdateCompanyDTO): Promise<{ company: CompanyProfile }> {
	return apiPut('/company', dto);
}

export async function getCompanyCode(): Promise<CompanyCodeResponse> {
	return apiGet('/company/code');
}
