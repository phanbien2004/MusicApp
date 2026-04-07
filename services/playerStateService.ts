import apiClient from '@/api/apiClient';
import { BASE_URL } from '@/constants/baseURL';

export interface SavePlayerStatePayload {
    currentSeekPosition: number;
    trackId: number;
    playlistId: number;
    albumId: number;
    memberId: number;
}

export const savePlayerStateAPI = async (payload: SavePlayerStatePayload) => {
    console.log(`PUT SAVEPLAYERSTATEAPI : ${BASE_URL}/api/v1/player-state`);
    console.log('Request SavePlayerStateAPI: ', payload);

    const res = await apiClient.put(`${BASE_URL}/api/v1/player-state`, null, {
        params: payload,
    });

    console.log('Response SavePlayerStateAPI: ', res.data);
    return res.data as string;
};
