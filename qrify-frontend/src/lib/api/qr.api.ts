import { apiGet } from './api-client';
import type { QrActiveQrData } from '$lib/types/qr.types';

export async function getPublicActiveQr(companyCode: string): Promise<QrActiveQrData> {
	return apiGet<QrActiveQrData>(`/public/companies/${companyCode}/active-qr`);
}
