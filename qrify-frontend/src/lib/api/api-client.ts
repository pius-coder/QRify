import { PUBLIC_API_URL } from '$env/static/public';
import { ApiError } from '$lib/utils/api-errors';
import type { ApiResponse } from '$lib/types/auth.types';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const url = `${PUBLIC_API_URL}${path}`;

	const res = await fetch(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: body ? JSON.stringify(body) : undefined
	});

	const json: ApiResponse<T> = await res.json();

	if (!json.success) {
		throw new ApiError(res.status, json.error.code, json.error.message, json.error.fields);
	}

	return json.data;
}

export function apiGet<T>(path: string): Promise<T> {
	return request<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
	return request<T>('POST', path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
	return request<T>('PUT', path, body);
}
