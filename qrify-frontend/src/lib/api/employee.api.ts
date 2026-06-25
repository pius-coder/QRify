import { apiGet, apiPut, apiPatch } from './api-client';
import type {
	EmployeeListResponseData,
	EmployeeResponseData,
	UpdateEmployeeDTO,
	UpdateEmployeeStatusDTO
} from '$lib/types/employee.types';

export async function listEmployees(): Promise<EmployeeListResponseData> {
	return apiGet('/employees');
}

export async function getEmployee(id: string): Promise<EmployeeResponseData> {
	return apiGet(`/employees/${id}`);
}

export async function updateEmployee(
	id: string,
	dto: UpdateEmployeeDTO
): Promise<EmployeeResponseData> {
	return apiPut(`/employees/${id}`, dto);
}

export async function updateEmployeeStatus(
	id: string,
	dto: UpdateEmployeeStatusDTO
): Promise<EmployeeResponseData> {
	return apiPatch(`/employees/${id}/status`, dto);
}
