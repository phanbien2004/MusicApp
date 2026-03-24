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
    playlists: PlayList[]
}

export const getProfileAPI = async (id: string) : Promise<ProfileResponse> => {
    console.log(`GetProfileAPI: ${BASE_URL}/api/v1/member/getProfile/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/member/getProfile/${id}`);
    const profileData = res.data as ProfileResponse;
    console.log("Responseres GetProfileAPI: ", profileData);
    return profileData;
}