export interface CompanyProfile {
	id: string;
	name: string;
	companyCode: string;
	timezone: string;
	status: 'ACTIVE' | 'SUSPENDED';
	createdAt: string;
	updatedAt: string;
}

export interface UpdateCompanyDTO {
	name: string;
	timezone: string;
}

export interface CompanyCodeResponse {
	companyCode: string;
}
