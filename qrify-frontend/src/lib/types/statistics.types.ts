export interface DashboardResponse {
	activeEmployees: number;
	presentToday: number;
	lateToday: number;
	absentToday: number;
	incompletePresences: number;
	activeQr: boolean;
	lastScans: LastScanResponse[];
}

export interface LastScanResponse {
	userId: string;
	firstName: string;
	lastName: string;
	eventType: string;
	scannedAt: string;
}

export interface PeriodStatsResponse {
	attendanceRate: number;
	lateCount: number;
	absenceCount: number;
	overtimeTotal: number;
	dailyChart: DailyChartResponse[];
}

export interface DailyChartResponse {
	workDate: string;
	present: number;
	late: number;
	absent: number;
}

export interface RankingsResponse {
	type: string;
	startDate: string;
	endDate: string;
	rankings: RankingEntryResponse[];
}

export interface RankingEntryResponse {
	userId: string;
	firstName: string;
	lastName: string;
	value: number;
}

export interface WeeklyReportResponse {
	year: number;
	week: number;
	entries: WeeklyReportEntryResponse[];
}

export interface WeeklyReportEntryResponse {
	userId: string;
	firstName: string;
	lastName: string;
	daysPresent: number;
	daysLate: number;
	daysAbsent: number;
	lateMinutes: number;
	workedMinutes: number;
	overtimeMinutes: number;
}
