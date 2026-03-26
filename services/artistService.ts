import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

export interface CreateArtistPayload {
    stageName: string;
    avatarKey: string;
    coverKey: string;
    bio: string;
}

export const createArtistProfileAPI = async (payload: CreateArtistPayload) => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/artist`, payload);
    return res.data;
};
