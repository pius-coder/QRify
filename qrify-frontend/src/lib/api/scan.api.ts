import { apiPost } from './api-client';
import type { ScanResponseData } from '$lib/types/scan.types';

export async function submitScan(token: string): Promise<ScanResponseData> {
	return apiPost<ScanResponseData>('/scans', { token });
}
