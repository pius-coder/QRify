import { writable, derived } from 'svelte/store';
import type {
	DashboardResponse,
	PeriodStatsResponse,
	RankingsResponse,
	WeeklyReportResponse
} from '$lib/types/statistics.types';
import { extractApiError } from '$lib/utils/api-errors';
import * as statisticsApi from '$lib/api/statistics.api';

export type StatsError = string | Record<string, string> | null;

interface StatisticsState {
	dashboard: DashboardResponse | null;
	periodStats: PeriodStatsResponse | null;
	rankings: RankingsResponse | null;
	weeklyReport: WeeklyReportResponse | null;
	isLoading: boolean;
	error: StatsError;
	isSuccess: boolean;
}

const _dashboard = writable<DashboardResponse | null>(null);
const _periodStats = writable<PeriodStatsResponse | null>(null);
const _rankings = writable<RankingsResponse | null>(null);
const _weeklyReport = writable<WeeklyReportResponse | null>(null);
const _isLoading = writable(false);
const _error = writable<StatsError>(null);
const _isSuccess = writable(false);

function createStatisticsStore() {
	const state = derived(
		[_dashboard, _periodStats, _rankings, _weeklyReport, _isLoading, _error, _isSuccess],
		([
			$dashboard,
			$periodStats,
			$rankings,
			$weeklyReport,
			$isLoading,
			$error,
			$isSuccess
		]): StatisticsState => ({
			dashboard: $dashboard,
			periodStats: $periodStats,
			rankings: $rankings,
			weeklyReport: $weeklyReport,
			isLoading: $isLoading,
			error: $error,
			isSuccess: $isSuccess
		})
	);

	async function loadDashboard(): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await statisticsApi.getDashboard();
			_dashboard.set(result);
			return true;
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return false;
		} finally {
			_isLoading.set(false);
		}
	}

	async function loadPeriodStats(startDate: string, endDate: string): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await statisticsApi.getPeriodStats(startDate, endDate);
			_periodStats.set(result);
			return true;
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return false;
		} finally {
			_isLoading.set(false);
		}
	}

	async function loadRankings(
		type: string,
		startDate: string,
		endDate: string
	): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await statisticsApi.getRankings(type, startDate, endDate);
			_rankings.set(result);
			return true;
		} catch (err) {
			const apiErr = extractApiError(err);
			_error.set(apiErr.fields ?? apiErr.message);
			return false;
		} finally {
			_isLoading.set(false);
		}
	}

	async function loadWeeklyReport(year: number, week: number): Promise<boolean> {
		_isLoading.set(true);
		_error.set(null);
		try {
			const result = await statisticsApi.getWeeklyReport(year, week);
			_weeklyReport.set(result);
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
		loadDashboard,
		loadPeriodStats,
		loadRankings,
		loadWeeklyReport,
		clearError,
		clearSuccess
	};
}

export const statistics = createStatisticsStore();
