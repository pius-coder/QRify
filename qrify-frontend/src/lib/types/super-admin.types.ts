export interface CompanyListItem {
	id: string;
	name: string;
	companyCode: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface CompanyDetail extends CompanyListItem {
	timezone: string;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface CompanyListResponseData {
	companies: CompanyListItem[];
	pagination: PaginationMeta;
}

export interface CompanyDetailResponseData {
	company: CompanyDetail;
}

export interface SuperAdminStatistics {
	totalCompanies: number;
	activeCompanies: number;
	suspendedCompanies: number;
	totalEmployees: number;
	todayScans: number;
	periodAttendance: number;
}

export interface SuperAdminStatisticsResponseData {
	statistics: SuperAdminStatistics;
}

export type ListCompaniesDTO = {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
};
