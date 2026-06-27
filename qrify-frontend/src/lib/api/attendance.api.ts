import { apiGet } from './api-client';
import type {
	AttendanceListResponseData,
	AttendanceDetailResponseData,
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
