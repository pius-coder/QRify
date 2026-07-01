import { apiPut } from './api-client';

export interface UpdateProfileDTO {
	firstName?: string;
	lastName?: string;
}

export interface UpdateProfileResponse {
	user: {
		id: string;
		firstName: string;
		lastName: string;
	};
}

export async function updateMyProfile(dto: UpdateProfileDTO): Promise<UpdateProfileResponse> {
	return apiPut('/me/profile', dto);
}
