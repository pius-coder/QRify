import { writable, derived } from 'svelte/store';
import type { CompanyListItem, PaginationMeta } from '$lib/types/super-admin.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as superAdminApi from '$lib/api/super-admin.api';

export type SuperAdminError = string | Record<string, string> | null;

interface CompaniesState {
	companies: CompanyListItem[];
	pagination: PaginationMeta | null;
	isLoading: boolean;
	error: SuperAdminError;
	isSuccess: boolean;
}

const _companies = writable<CompanyListItem[]>([]);
const _pagination = writable<PaginationMeta | null>(null);
const _isLoading = writable(false);
const _error = writable<SuperAdminError>(null);
const _isSuccess = writable(false);

function createCompaniesStore() {
	const state = derived(
		[_companies, _pagination, _isLoading, _error, _isSuccess],
		([$companies, $pagination, $isLoading, $error, $isSuccess]): CompaniesState => ({
			companies: $companies,
			pagination: $pagination,
			isLoading: $isLoading,
			error: $error,
			isSuccess: $isSuccess
		})
	);

	async function load(params?: {
		search?: string;
		status?: string;
		page?: number;
		limit?: number;
	}) {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await superAdminApi.listCompanies(params);
			_companies.set(result.companies);
			_pagination.set(result.pagination);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
		} finally {
			_isLoading.set(false);
		}
	}

	async function updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		_isSuccess.set(false);
		try {
			await superAdminApi.updateCompanyStatus(id, status);
			_companies.update((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
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

export const companies = createCompaniesStore();
