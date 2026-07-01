import { writable, derived } from 'svelte/store';
import type {
	AttendanceRecordResponse,
	ScanEventResponse,
	AttendanceSummaryResponse
} from '$lib/types/attendance.types';
import type {
	EmployeeAttendanceListResponse,
	EmployeeAttendanceDetailResponse
} from '$lib/types/attendance.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as attendanceApi from '$lib/api/attendance.api';
import * as profileApi from '$lib/api/profile.api';

export type EmployeeSelfError = string | Record<string, string> | null;

/* ── Sub-states ── */
interface HistoryState {
	attendances: AttendanceRecordResponse[];
	total: number;
	isLoading: boolean;
	error: EmployeeSelfError;
}

interface DetailState {
	attendance: AttendanceRecordResponse | null;
	scanEvents: ScanEventResponse[];
	isLoading: boolean;
	error: EmployeeSelfError;
}

interface SummaryState {
	summary: AttendanceSummaryResponse | null;
	isLoading: boolean;
	error: EmployeeSelfError;
}

interface ProfileState {
	isLoading: boolean;
	error: EmployeeSelfError;
	success: boolean;
}

/* ── Root state ── */
interface EmployeeSelfState {
	history: HistoryState;
	detail: DetailState;
	summary: SummaryState;
	profile: ProfileState;
}

/* ── Writable stores ── */
const _history = writable<AttendanceRecordResponse[]>([]);
const _historyTotal = writable(0);
const _historyLoading = writable(false);
const _historyError = writable<EmployeeSelfError>(null);

const _detail = writable<AttendanceRecordResponse | null>(null);
const _detailEvents = writable<ScanEventResponse[]>([]);
const _detailLoading = writable(false);
const _detailError = writable<EmployeeSelfError>(null);

const _summary = writable<AttendanceSummaryResponse | null>(null);
const _summaryLoading = writable(false);
const _summaryError = writable<EmployeeSelfError>(null);

const _profileLoading = writable(false);
const _profileError = writable<EmployeeSelfError>(null);
const _profileSuccess = writable(false);

/* ── Derived root state ── */
const state = derived(
	[
		_history,
		_historyTotal,
		_historyLoading,
		_historyError,
		_detail,
		_detailEvents,
		_detailLoading,
		_detailError,
		_summary,
		_summaryLoading,
		_summaryError,
		_profileLoading,
		_profileError,
		_profileSuccess
	],
	([$h, $ht, $hl, $he, $d, $de, $dl, $der, $s, $sl, $se, $pl, $pe, $ps]): EmployeeSelfState => ({
		history: {
			attendances: $h,
			total: $ht,
			isLoading: $hl,
			error: $he
		},
		detail: {
			attendance: $d,
			scanEvents: $de,
			isLoading: $dl,
			error: $der
		},
		summary: {
			summary: $s,
			isLoading: $sl,
			error: $se
		},
		profile: {
			isLoading: $pl,
			error: $pe,
			success: $ps
		}
	})
);

/* ── Store factory ── */
function createEmployeeSelfStore() {
	/* ── History ── */
	async function loadHistory(startDate?: string, endDate?: string) {
		_historyLoading.set(true);
		_historyError.set(null);
		try {
			const result: EmployeeAttendanceListResponse = await attendanceApi.listMyAttendances(
				startDate,
				endDate
			);
			_history.set(result.attendances);
			_historyTotal.set(result.total);
		} catch (err) {
			const apiErr = extractApiError(err);
			_historyError.set(apiErr.fields ?? apiErr.message);
		} finally {
			_historyLoading.set(false);
		}
	}

	/* ── Detail ── */
	async function loadDetail(date: string) {
		_detailLoading.set(true);
		_detailError.set(null);
		try {
			const result: EmployeeAttendanceDetailResponse =
				await attendanceApi.getMyAttendanceByDate(date);
			_detail.set(result.attendance);
			_detailEvents.set(result.scanEvents);
		} catch (err) {
			const apiErr = extractApiError(err);
			_detailError.set(apiErr.fields ?? apiErr.message);
		} finally {
			_detailLoading.set(false);
		}
	}

	/* ── Summary ── */
	async function loadSummary(startDate?: string, endDate?: string) {
		_summaryLoading.set(true);
		_summaryError.set(null);
		try {
			const result: AttendanceSummaryResponse = await attendanceApi.getAttendanceSummary(
				startDate,
				endDate
			);
			_summary.set(result);
		} catch (err) {
			const apiErr = extractApiError(err);
			_summaryError.set(apiErr.fields ?? apiErr.message);
		} finally {
			_summaryLoading.set(false);
		}
	}

	/* ── Profile ── */
	async function updateProfile(dto: profileApi.UpdateProfileDTO): Promise<boolean> {
		_profileLoading.set(true);
		_profileError.set(null);
		_profileSuccess.set(false);
		try {
			await profileApi.updateMyProfile(dto);
			_profileSuccess.set(true);
			return true;
		} catch (err) {
			const apiErr = extractApiError(err);
			_profileError.set(apiErr.fields ?? apiErr.message);
			return false;
		} finally {
			_profileLoading.set(false);
		}
	}

	/* ── Clears ── */
	function clearHistoryError() {
		_historyError.set(null);
	}

	function clearDetailError() {
		_detailError.set(null);
	}

	function clearSummaryError() {
		_summaryError.set(null);
	}

	function clearProfileError() {
		_profileError.set(null);
	}

	function clearProfileSuccess() {
		_profileSuccess.set(false);
	}

	return {
		subscribe: state.subscribe,
		loadHistory,
		loadDetail,
		loadSummary,
		updateProfile,
		clearHistoryError,
		clearDetailError,
		clearSummaryError,
		clearProfileError,
		clearProfileSuccess
	};
}

export const employeeSelf = createEmployeeSelfStore();
