import { apiGet } from './api-client';
import type {
	DashboardResponse,
	PeriodStatsResponse,
	RankingsResponse,
	WeeklyReportResponse
} from '$lib/types/statistics.types';

export async function getDashboard(): Promise<DashboardResponse> {
	return apiGet('/statistics/dashboard');
}

export async function getPeriodStats(
	startDate: string,
	endDate: string
): Promise<PeriodStatsResponse> {
	return apiGet(`/statistics/attendance?startDate=${startDate}&endDate=${endDate}`);
}

export async function getRankings(
	type: string,
	startDate: string,
	endDate: string
): Promise<RankingsResponse> {
	return apiGet(`/statistics/rankings?type=${type}&startDate=${startDate}&endDate=${endDate}`);
}

export async function getWeeklyReport(year: number, week: number): Promise<WeeklyReportResponse> {
	return apiGet(`/statistics/reports/weekly?year=${year}&week=${week}`);
}
