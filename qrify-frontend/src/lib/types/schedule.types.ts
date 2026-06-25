export const WEEKDAY_NAMES: Record<number, string> = {
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday',
	7: 'Sunday'
};

export const WEEKDAY_LABELS: { value: number; label: string }[] = [
	{ value: 1, label: 'Monday' },
	{ value: 2, label: 'Tuesday' },
	{ value: 3, label: 'Wednesday' },
	{ value: 4, label: 'Thursday' },
	{ value: 5, label: 'Friday' },
	{ value: 6, label: 'Saturday' },
	{ value: 7, label: 'Sunday' }
];

export interface ScheduleResponse {
	id: string;
	companyId: string;
	startTime: string;
	breakStartTime: string | null;
	breakEndTime: string | null;
	endTime: string;
	lateToleranceMinutes: number;
	weekdays: number[];
	createdAt: string;
	updatedAt: string;
}

export interface UpdateScheduleDTO {
	startTime: string;
	breakStartTime: string | null;
	breakEndTime: string | null;
	endTime: string;
	lateToleranceMinutes: number;
	weekdays: number[];
}

export interface ScheduleResponseData {
	schedule: ScheduleResponse;
}
