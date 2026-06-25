import { writable, derived } from 'svelte/store';
import type { EmployeeResponse, UpdateEmployeeStatusDTO } from '$lib/types/employee.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as employeeApi from '$lib/api/employee.api';

export type EmployeeError = string | Record<string, string> | null;

interface EmployeeState {
	employees: EmployeeResponse[];
	isLoading: boolean;
	error: EmployeeError;
	isSuccess: boolean;
}

const _employees = writable<EmployeeResponse[]>([]);
const _isLoading = writable(false);
const _error = writable<EmployeeError>(null);
const _isSuccess = writable(false);

function createEmployeeStore() {
	const state = derived(
		[_employees, _isLoading, _error, _isSuccess],
		([$employees, $isLoading, $error, $isSuccess]): EmployeeState => ({
			employees: $employees,
			isLoading: $isLoading,
			error: $error,
			isSuccess: $isSuccess
		})
	);

	async function load() {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await employeeApi.listEmployees();
			_employees.set(result.employees);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
		} finally {
			_isLoading.set(false);
		}
	}

	async function updateStatus(id: string, dto: UpdateEmployeeStatusDTO): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		_isSuccess.set(false);
		try {
			const result = await employeeApi.updateEmployeeStatus(id, dto);
			_employees.update((list) => list.map((e) => (e.id === id ? result.employee : e)));
			_isSuccess.set(true);
			return true;
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return false;
		} finally {
			_isLoading.set(false);
		}
	}

	function clearError() {
		_error.set(null);
	}

	function clearSuccess() {
		_isSuccess.set(false);
	}

	return {
		subscribe: state.subscribe,
		load,
		updateStatus,
		clearError,
		clearSuccess
	};
}

export const employees = createEmployeeStore();
