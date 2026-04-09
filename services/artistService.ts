import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

export interface CreateArtistPayload {
    stageName: string;
    avatarKey: string;
    coverKey: string;
    bio: string;
}

export interface ArtistProfileData {
    id: number;
    stageName: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    followerCount: number;
}

export const getMyArtistProfileAPI = async (): Promise<ArtistProfileData> => {
    console.log(`GET Artist Profile: ${BASE_URL}/api/v1/artist/myProfile` );
    const res = await apiClient.get(`${BASE_URL}/api/v1/artist/myProfile`);
    console.log("Response Get Artist Profile: ", res.data);
    return res.data;
}

// Tạo mới yêu cầu đăng ký (POST /api/v1/artist)
export const createArtistProfileAPI = async (payload: CreateArtistPayload) => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/artist`, payload);
    return res.data;
};

// Lấy hồ sơ nghệ sĩ theo artistId (GET /api/v1/artist/{id})
export const getArtistProfileAPI = async (artistId: number): Promise<ArtistProfileData> => {
    const res = await apiClient.get(`${BASE_URL}/api/v1/artist/${artistId}`);
    return res.data;
};

// Cập nhật hồ sơ khi đang PENDING (PUT /api/v1/artist/update)
export const updateArtistProfileAPI = async (payload: Partial<CreateArtistPayload>) => {
    const res = await apiClient.put(`${BASE_URL}/api/v1/artist/update`, payload);
    return res.data;
};
