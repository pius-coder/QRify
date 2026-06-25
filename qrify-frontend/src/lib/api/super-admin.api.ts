import { apiGet, apiPatch } from './api-client';
import type {
	CompanyListResponseData,
	CompanyDetailResponseData,
	SuperAdminStatisticsResponseData,
	ListCompaniesDTO
} from '$lib/types/super-admin.types';

export async function listCompanies(params?: ListCompaniesDTO): Promise<CompanyListResponseData> {
	const searchParams = new URLSearchParams();
	if (params?.search) searchParams.set('search', params.search);
	if (params?.status) searchParams.set('status', params.status);
	if (params?.page) searchParams.set('page', String(params.page));
	if (params?.limit) searchParams.set('limit', String(params.limit));
	const qs = searchParams.toString();
	return apiGet(`/super-admin/companies${qs ? `?${qs}` : ''}`);
}

export async function getCompany(id: string): Promise<CompanyDetailResponseData> {
	return apiGet(`/super-admin/companies/${id}`);
}

export async function updateCompanyStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<CompanyDetailResponseData> {
	return apiPatch(`/super-admin/companies/${id}/status`, { status });
}

export async function getStatistics(): Promise<SuperAdminStatisticsResponseData> {
	return apiGet('/super-admin/statistics');
}
