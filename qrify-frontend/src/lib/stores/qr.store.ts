import { writable, derived } from 'svelte/store';
import type { ActiveQrResponse } from '$lib/types/qr.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as qrApi from '$lib/api/qr.api';

export type QrError = string | Record<string, string> | null;

export interface QrDisplayState {
	activeQr: ActiveQrResponse | null;
	isLoading: boolean;
	error: QrError;
	isSuspended: boolean;
	companyNotFound: boolean;
	isNoQr: boolean;
}

const _activeQr = writable<ActiveQrResponse | null>(null);
const _isLoading = writable(false);
const _error = writable<QrError>(null);
const _isSuspended = writable(false);
const _companyNotFound = writable(false);
const _isNoQr = writable(false);

function createQrDisplayStore() {
	const state = derived(
		[_activeQr, _isLoading, _error, _isSuspended, _companyNotFound, _isNoQr],
		([$activeQr, $isLoading, $error, $isSuspended, $companyNotFound, $isNoQr]): QrDisplayState => ({
			activeQr: $activeQr,
			isLoading: $isLoading,
			error: $error,
			isSuspended: $isSuspended,
			companyNotFound: $companyNotFound,
			isNoQr: $isNoQr
		})
	);

	async function load(companyCode: string) {
		_isLoading.set(true);
		_error.set(null);
		_isSuspended.set(false);
		_companyNotFound.set(false);
		_isNoQr.set(false);
		try {
			const result = await qrApi.getPublicActiveQr(companyCode);
			_activeQr.set(result.activeQr);
		} catch (err) {
			const apiErr = extractApiError(err);
			_activeQr.set(null);
			switch (apiErr.code) {
				case 'CompanyCodeNotFoundError':
					_companyNotFound.set(true);
					break;
				case 'CompanyNotActiveError':
					_isSuspended.set(true);
					break;
				case 'NoActiveQrError':
				case 'NotWorkingDayError':
				case 'NoScheduleError':
					_isNoQr.set(true);
					break;
				default:
					_error.set(apiErr.fields ?? apiErr.message);
			}
		} finally {
			_isLoading.set(false);
		}
	}

	function clearState() {
		_activeQr.set(null);
		_isLoading.set(false);
		_error.set(null);
		_isSuspended.set(false);
		_companyNotFound.set(false);
		_isNoQr.set(false);
	}

	return {
		subscribe: state.subscribe,
		load,
		clearState
	};
}

export const qrDisplay = createQrDisplayStore();
