import { apiGet, apiPut } from './api-client';
import type { ScheduleResponseData, UpdateScheduleDTO } from '$lib/types/schedule.types';

export async function getSchedule(): Promise<ScheduleResponseData> {
	return apiGet('/company/schedule');
}

export async function upsertSchedule(dto: UpdateScheduleDTO): Promise<ScheduleResponseData> {
	return apiPut('/company/schedule', dto);
}
