import apiClient from '@/api/apiClient';

export type InteractionType =
    | 'SAVED'
    | 'PICK'
    | 'PLAY'
    | 'SKIP'
    | 'PREVIOUS'
    | 'PAUSE'
    | 'JAM'
    | 'SHARE'
    | 'JUMP';

export interface CreateInteractionPayload {
    trackId: number;
    interactionType: InteractionType;
    duration?: number;
}

export const createInteractionAPI = async (payload: CreateInteractionPayload): Promise<string> => {
    const res = await apiClient.post('/api/v1/user-interaction', {
        trackId: payload.trackId,
        interactionType: payload.interactionType,
        duration: payload.duration ?? 0,
    });

    return res.data as string;
};
