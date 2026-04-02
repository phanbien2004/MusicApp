import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

interface PlayList {
    id: number;
    title: string;
    thumbnailUrl: string;
}

export interface ProfileResponse {
    id: number;
    displayName: string;
    avatarUrl: string;
    followedArtistCount: number,
    friendCount: number,
    playlistCount: number,
    playlists: PlayList[],
    subscriptionType?: 'FREE' | 'PREMIUM',
    artistStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
    // — Thông tin Nghệ sĩ (Backend cần trả về thêm các trường này)
    artistStageName?: string,
    artistBio?: string,
    artistAvatarUrl?: string,
    artistCoverUrl?: string,
}

export const getProfileAPI = async (id: string) : Promise<ProfileResponse> => {
    console.log(`GetProfileAPI: ${BASE_URL}/api/v1/member/getProfile/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/member/getProfile/${id}`);
    const profileData = res.data as ProfileResponse;
    console.log("Responseres GetProfileAPI: ", profileData);
    return profileData;
}

export const getMyProfileAPI = async () : Promise<ProfileResponse> => {
    console.log(`GetMyProfileAPI: ${BASE_URL}/api/v1/member/myProfile`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/member/myProfile`);
    const profileData = res.data as ProfileResponse;
    console.log("Response GetMyProfileAPI: ", profileData);
    return profileData;
}

export interface UpdateProfilePayload {
    displayName: string;
    avatarKey: string;
}

export const updateProfileAPI = async (payload: UpdateProfilePayload) => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/member/updateProfile`, payload);
    return res.data; // Server trả về chuỗi "Profile updated successfully!"
};