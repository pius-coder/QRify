import { writable, derived } from 'svelte/store';
import type {
	User,
	LoginDTO,
	RegisterCompanyDTO,
	RegisterEmployeeDTO
} from '$lib/types/auth.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as authApi from '$lib/api/auth.api';

export type AuthError = string | Record<string, string> | null;

interface AuthState {
	user: User | null;
	isLoading: boolean;
	error: AuthError;
}

const _user = writable<User | null>(null);
const _isLoading = writable(true);
const _error = writable<AuthError>(null);

function createAuthStore() {
	const state = derived(
		[_user, _isLoading, _error],
		([$user, $isLoading, $error]): AuthState => ({
			user: $user,
			isLoading: $isLoading,
			error: $error
		})
	);

	async function init() {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await authApi.getMe();
			_user.set(result.user);
		} catch {
			_user.set(null);
		} finally {
			_isLoading.set(false);
		}
	}

	async function login(dto: LoginDTO): Promise<User | null> {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await authApi.login(dto);
			_user.set(result.user);
			return result.user;
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return null;
		} finally {
			_isLoading.set(false);
		}
	}

	async function logout() {
		try {
			await authApi.logout();
		} catch {
			// ignore
		}
		_user.set(null);
	}

	async function registerCompany(dto: RegisterCompanyDTO) {
		_isLoading.set(true);
		_error.set(null);
		try {
			return await authApi.registerCompany(dto);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return null;
		} finally {
			_isLoading.set(false);
		}
	}

	async function registerEmployee(dto: RegisterEmployeeDTO) {
		_isLoading.set(true);
		_error.set(null);
		try {
			return await authApi.registerEmployee(dto);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return null;
		} finally {
			_isLoading.set(false);
		}
	}

	function clearError() {
		_error.set(null);
	}

	return {
		subscribe: state.subscribe,
		init,
		login,
		logout,
		registerCompany,
		registerEmployee,
		clearError
	};
}

export const auth = createAuthStore();
