export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: string,
		message: string,
		public readonly fields?: Record<string, string>
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export function extractApiError(err: unknown): ApiError {
	if (err instanceof ApiError) return err;

	if (err instanceof TypeError && err.message === 'Failed to fetch') {
		return new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection.');
	}

	return new ApiError(0, 'UNKNOWN_ERROR', 'An unexpected error occurred.');
}
