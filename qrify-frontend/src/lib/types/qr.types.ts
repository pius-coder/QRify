export interface ActiveQrResponse {
	sessionId: string;
	companyId: string;
	companyName: string;
	eventType: string;
	token: string;
	validFrom: string;
	validUntil: string;
	workDate: string;
}

export interface QrActiveQrData {
	activeQr: ActiveQrResponse | null;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
	ARRIVAL: 'Arrivée',
	BREAK_START: 'Début de pause',
	BREAK_END: 'Fin de pause',
	DEPARTURE: 'Départ'
};
