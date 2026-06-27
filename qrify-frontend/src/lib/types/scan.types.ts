export interface ScanResponse {
	id: string;
	eventType: string;
	result: string;
	scannedAt: string;
}

export interface ScanResponseData {
	scan: ScanResponse;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
	ARRIVAL: 'Arrival',
	BREAK_START: 'Break Start',
	BREAK_END: 'Break End',
	DEPARTURE: 'Departure'
};

export const SCAN_RESULT_LABELS: Record<string, string> = {
	ACCEPTED: 'Accepted',
	DUPLICATE: 'Duplicate',
	EXPIRED: 'Expired',
	INVALID_SEQUENCE: 'Invalid Sequence',
	WRONG_COMPANY: 'Wrong Company',
	USER_NOT_ACTIVE: 'User Not Active',
	COMPANY_SUSPENDED: 'Company Suspended',
	INVALID_TOKEN: 'Invalid Token'
};
