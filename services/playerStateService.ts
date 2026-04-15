import apiClient from '@/api/apiClient';
import { BASE_URL } from '@/constants/baseURL';
import { TrackContentType } from './searchService';

export interface SavePlayerStatePayload {
    currentSeekPosition: number;
    trackId: number;
    playlistId: number;
    albumId: number;
    memberId: number;
}

export interface PlayerStateResponse {
    trackId: number;
    trackTitle: string;
    thumbnailUrl: string | null;
    trackUrl: string;
    seekPosition: number;
    playlistId: number | null;
    albumId: number | null;
}

export interface PlayerQueueResponse {
    content: TrackContentType[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

export const savePlayerStateAPI = async (payload: SavePlayerStatePayload) => {
    console.log(`PUT SAVEPLAYERSTATEAPI : ${BASE_URL}/api/v1/player-state`);
    console.log('Request SavePlayerStateAPI: ', payload);

    const res = await apiClient.put(`${BASE_URL}/api/v1/player-state`, payload);

    console.log('Response SavePlayerStateAPI: ', res.data);
    return res.data as string;
};

export const getPlayerQueueAPI = async (index: number): Promise<PlayerQueueResponse> => {
    console.log(`GET PLAYERQUEUEAPI : ${BASE_URL}/api/v1/player/queue?index=${index}`);

    const res = await apiClient.get(`${BASE_URL}/api/v1/player/queue`, {
        params: { index },
    });

    console.log('Response GetPlayerQueueAPI: ', res.data);
    return res.data as PlayerQueueResponse;
};

export const getPlayerStateAPI = async (): Promise<PlayerStateResponse | null> => {
    try {
        const res = await apiClient.get(`${BASE_URL}/api/v1/player-state`);
        return res.data as PlayerStateResponse;
    } catch {
        return null;
    }
};
