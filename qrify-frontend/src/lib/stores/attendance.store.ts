import { writable, derived } from 'svelte/store';
import type {
	AttendanceResponse,
	AttendanceDetailResponse,
	PaginationMeta
} from '$lib/types/attendance.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as attendanceApi from '$lib/api/attendance.api';

export type AttendanceError = string | Record<string, string> | null;

interface AttendanceState {
	attendances: AttendanceResponse[];
	pagination: PaginationMeta | null;
	isLoading: boolean;
	error: AttendanceError;
}

interface AttendanceDetailState {
	currentAttendance: AttendanceDetailResponse | null;
	detailLoading: boolean;
	detailError: AttendanceError;
}

const _attendances = writable<AttendanceResponse[]>([]);
const _pagination = writable<PaginationMeta | null>(null);
const _isLoading = writable(false);
const _error = writable<AttendanceError>(null);

const _currentAttendance = writable<AttendanceDetailResponse | null>(null);
const _detailLoading = writable(false);
const _detailError = writable<AttendanceError>(null);

function createAttendanceStore() {
	const state = derived(
		[_attendances, _pagination, _isLoading, _error],
		([$attendances, $pagination, $isLoading, $error]): AttendanceState => ({
			attendances: $attendances,
			pagination: $pagination,
			isLoading: $isLoading,
			error: $error
		})
	);

	const detailState = derived(
		[_currentAttendance, _detailLoading, _detailError],
		([$currentAttendance, $detailLoading, $detailError]): AttendanceDetailState => ({
			currentAttendance: $currentAttendance,
			detailLoading: $detailLoading,
			detailError: $detailError
		})
	);

	async function load(params?: {
		date?: string;
		status?: string;
		search?: string;
		page?: number;
		limit?: number;
	}) {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await attendanceApi.listAttendances(params);
			_attendances.set(result.attendances);
			_pagination.set(result.pagination);
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
		} finally {
			_isLoading.set(false);
		}
	}

	async function getAttendance(id: string) {
		_detailLoading.set(true);
		_detailError.set(null);
		try {
			const result = await attendanceApi.getAttendance(id);
			_currentAttendance.set(result.attendance);
		} catch (err) {
			const apiErr = extractApiError(err);
			_detailError.set(apiErr.fields ?? apiErr.message);
		} finally {
			_detailLoading.set(false);
		}
	}

	function clearError() {
		_error.set(null);
	}

	function clearDetail() {
		_currentAttendance.set(null);
		_detailError.set(null);
	}

	return {
		subscribe: state.subscribe,
		detail: { subscribe: detailState.subscribe },
		load,
		getAttendance,
		clearError,
		clearDetail
	};
}

export const attendances = createAttendanceStore();
