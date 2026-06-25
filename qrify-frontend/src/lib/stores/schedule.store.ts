import { writable, derived } from 'svelte/store';
import type { ScheduleResponse, UpdateScheduleDTO } from '$lib/types/schedule.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as scheduleApi from '$lib/api/schedule.api';

export type ScheduleError = string | Record<string, string> | null;

interface ScheduleState {
	schedule: ScheduleResponse | null;
	isLoading: boolean;
	error: ScheduleError;
	isSuccess: boolean;
}

const _schedule = writable<ScheduleResponse | null>(null);
const _isLoading = writable(false);
const _error = writable<ScheduleError>(null);
const _isSuccess = writable(false);

function createScheduleStore() {
	const state = derived(
		[_schedule, _isLoading, _error, _isSuccess],
		([$schedule, $isLoading, $error, $isSuccess]): ScheduleState => ({
			schedule: $schedule,
			isLoading: $isLoading,
			error: $error,
			isSuccess: $isSuccess
		})
	);

	async function load() {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await scheduleApi.getSchedule();
			_schedule.set(result.schedule);
		} catch (err) {
			const apiErr = extractApiError(err);
			if (apiErr.status === 404) {
				_schedule.set(null);
				_error.set(null);
			} else {
				_error.set(apiErr.fields ?? apiErr.message);
			}
		} finally {
			_isLoading.set(false);
		}
	}

	async function update(dto: UpdateScheduleDTO): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		_isSuccess.set(false);
		try {
			const result = await scheduleApi.upsertSchedule(dto);
			_schedule.set(result.schedule);
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

export const schedule = createScheduleStore();
