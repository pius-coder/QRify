export interface User {
	id: string;
	companyId: string | null;
	firstName: string;
	lastName: string;
	email: string;
	role: 'COMPANY_ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
	status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
	createdAt: string;
}

export interface CompanyInfo {
	id: string;
	name: string;
	code: string;
}

export interface LoginDTO {
	email: string;
	password: string;
}

export interface RegisterCompanyDTO {
	companyName: string;
	companyCode: string;
	timezone?: string;
	adminFirstName: string;
	adminLastName: string;
	adminEmail: string;
	adminPassword: string;
}

export interface RegisterEmployeeDTO {
	companyCode: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	message?: string;
}

export interface ApiErrorBody {
	code: string;
	message: string;
	fields?: Record<string, string>;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
