import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

export interface CreateArtistPayload {
    stageName: string;
    avatarKey: string;
    coverKey: string;
    bio: string;
}

export interface AlbumsContentDTO {
    id: number;
    title: string;
    thumbnailUrl: string;
    releaseYear: number;
}

export interface AlbumsDTO {
    content: AlbumsContentDTO[];
    currentPage: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}

export interface ArtistTrackContributorDTO {
    id: number;
    name: string;
    role?: "OWNER" | "PRODUCER" | "FEATURED" | string;
}

export interface PopularTrackDTO {
    id: number;
    title: string;
    trackUrl: string;
    thumbnailUrl: string;
    duration: number;
    contributors: ArtistTrackContributorDTO[];
}

export interface ArtistProfileData {
    id: number;
    stageName: string;
    avatarUrl: string;
    coverUrl: string;
    followerCount: number;
    bio?: string;
    status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    popularTracks?: PopularTrackDTO[];
    albums?: AlbumsDTO;
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
    console.log(`GET Artist Public Profile: ${BASE_URL}/api/v1/artist/${artistId}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/artist/${artistId}`);
    console.log("Response Get Artist Public Profile: ", res.data);
    return res.data as ArtistProfileData;
};

// Cập nhật hồ sơ khi đang PENDING (PUT /api/v1/artist/update)
export const updateArtistProfileAPI = async (payload: Partial<CreateArtistPayload>) => {
    const res = await apiClient.put(`${BASE_URL}/api/v1/artist/update`, payload);
    return res.data;
};
