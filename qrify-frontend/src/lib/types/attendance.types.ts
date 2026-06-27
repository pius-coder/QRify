export interface AttendanceResponse {
	id: string;
	companyId: string;
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	workDate: string;
	arrivalAt: string | null;
	breakStartAt: string | null;
	breakEndAt: string | null;
	departureAt: string | null;
	status: string;
	lateMinutes: number;
	breakMinutes: number;
	workedMinutes: number;
	overtimeMinutes: number;
	createdAt: string;
	updatedAt: string;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
}

export interface AttendanceListResponseData {
	attendances: AttendanceResponse[];
	pagination: PaginationMeta;
}

export interface ListAttendancesDTO {
	date?: string;
	status?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
	PRESENT: 'Present',
	LATE: 'Late',
	ABSENT: 'Absent',
	INCOMPLETE: 'Incomplete'
};

export const ATTENDANCE_STATUS_VARIANTS: Record<string, string> = {
	PRESENT: 'default',
	LATE: 'destructive',
	ABSENT: 'outline',
	INCOMPLETE: 'secondary'
};
