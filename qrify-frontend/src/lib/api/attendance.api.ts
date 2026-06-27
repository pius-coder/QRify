import { apiGet } from './api-client';
import type {
	AttendanceListResponseData,
	AttendanceDetailResponseData,
	AttendanceSummaryResponse,
	TodayAttendanceResponse,
	EmployeeAttendanceListResponse,
	EmployeeAttendanceDetailResponse,
	ListAttendancesDTO
} from '$lib/types/attendance.types';

export async function listAttendances(
	params?: ListAttendancesDTO
): Promise<AttendanceListResponseData> {
	const searchParams = new URLSearchParams();
	if (params?.date) searchParams.set('date', params.date);
	if (params?.status) searchParams.set('status', params.status);
	if (params?.search) searchParams.set('search', params.search);
	if (params?.page) searchParams.set('page', String(params.page));
	if (params?.limit) searchParams.set('limit', String(params.limit));
	const qs = searchParams.toString();
	return apiGet(`/attendances${qs ? `?${qs}` : ''}`);
}

export async function getAttendance(id: string): Promise<AttendanceDetailResponseData> {
	return apiGet(`/attendances/${id}`);
}

export async function getTodayAttendance(): Promise<TodayAttendanceResponse> {
	return apiGet('/me/attendance/today');
}

export async function listMyAttendances(
	startDate?: string,
	endDate?: string
): Promise<EmployeeAttendanceListResponse> {
	const searchParams = new URLSearchParams();
	if (startDate) searchParams.set('startDate', startDate);
	if (endDate) searchParams.set('endDate', endDate);
	const qs = searchParams.toString();
	return apiGet(`/me/attendances${qs ? `?${qs}` : ''}`);
}

export async function getMyAttendanceByDate(
	date: string
): Promise<EmployeeAttendanceDetailResponse> {
	return apiGet(`/me/attendances/${date}`);
}

export async function getAttendanceSummary(
	startDate?: string,
	endDate?: string
): Promise<AttendanceSummaryResponse> {
	const searchParams = new URLSearchParams();
	if (startDate) searchParams.set('startDate', startDate);
	if (endDate) searchParams.set('endDate', endDate);
	const qs = searchParams.toString();
	return apiGet(`/me/attendance-summary${qs ? `?${qs}` : ''}`);
}
