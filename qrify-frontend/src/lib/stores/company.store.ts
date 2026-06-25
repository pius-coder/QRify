import { writable, derived } from 'svelte/store';
import type { CompanyProfile, UpdateCompanyDTO } from '$lib/types/company.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as companyApi from '$lib/api/company.api';

export type CompanyError = string | Record<string, string> | null;

interface CompanyState {
	profile: CompanyProfile | null;
	isLoading: boolean;
	error: CompanyError;
	isSuccess: boolean;
}

const _profile = writable<CompanyProfile | null>(null);
const _isLoading = writable(false);
const _error = writable<CompanyError>(null);
const _isSuccess = writable(false);

function createCompanyStore() {
	const state = derived(
		[_profile, _isLoading, _error, _isSuccess],
		([$profile, $isLoading, $error, $isSuccess]): CompanyState => ({
			profile: $profile,
			isLoading: $isLoading,
			error: $error,
			isSuccess: $isSuccess
		})
	);

	async function load() {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await companyApi.getCompany();
			_profile.set(result.company);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
		} finally {
			_isLoading.set(false);
		}
	}

	async function update(dto: UpdateCompanyDTO): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		_isSuccess.set(false);
		try {
			const result = await companyApi.updateCompany(dto);
			_profile.set(result.company);
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
		update,
		clearError,
		clearSuccess
	};
}

export const company = createCompanyStore();
