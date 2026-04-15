import apiClient from '@/api/apiClient';

export type InteractionType = 'SAVED' | 'PLAY' | 'SKIP' | 'PREVIOUS' | 'PAUSE' | 'JAM' | 'SHARE' | 'JUMP';

export interface CreateInteractionPayload {
    trackId: number;
    interactionType: InteractionType;
    listenDuration?: number;
}

export const createInteractionAPI = async (payload: CreateInteractionPayload): Promise<string> => {
    const res = await apiClient.post('/api/v1/user-interaction', null, {
        params: {
            trackId: payload.trackId,
            interactionType: payload.interactionType,
            duration: payload.listenDuration ?? 0,
        },
    });

    return res.data as string;
};
