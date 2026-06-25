export interface EmployeeResponse {
	id: string;
	companyId: string | null;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateEmployeeDTO {
	firstName?: string;
	lastName?: string;
	email?: string;
}

export interface UpdateEmployeeStatusDTO {
	status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
}

export interface EmployeeListResponseData {
	employees: EmployeeResponse[];
}

export interface EmployeeResponseData {
	employee: EmployeeResponse;
}
