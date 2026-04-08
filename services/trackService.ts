import apiClient from '@/api/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubmitDraftPayload {
    title: string;
    trackKey: string;
    thumbnailKey: string | null;
    duration: number;
    featuredArtistDTO: contributorDTO[];
}

export interface TagDTO {
    id: number;
    displayName: string;
}

export interface FeaturedArtistDTO {
    id: number;
    avatarUrl: string;
    name: string;
    followed: boolean;
}

export interface SubmitDraftResponse {
    trackId: number;
    title: string;
    trackUrl: string;
    thumbnailUrl: string;
    recommendedTags: TagDTO[];
    featuredArtists: FeaturedArtistDTO[];
}

export interface contributorDTO {
    id: number;
    role: "OWNER" | "PRODUCER" | "FEATURED"
}

export interface SubmitFinalizePayload {
    id: number;
    contributors: contributorDTO[];
    tagIds: number[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const submitDraftAPI = async (payload: SubmitDraftPayload): Promise<SubmitDraftResponse> => {
    console.log('[trackService] submitDraft payload:', payload);
    const res = await apiClient.post('/api/v1/track/submitDraft', payload);
    console.log('[trackService] submitDraft response:', res.data);
    return res.data as SubmitDraftResponse;
};

export const submitFinalizeAPI = async (payload: SubmitFinalizePayload): Promise<string> => {
    console.log('[trackService] submitFinalize payload:', payload);
    const res = await apiClient.post('/api/v1/track/submitFinalize', payload);
    console.log('[trackService] submitFinalize response:', res.data);
    return res.data as string;
};

export const getAllTagsAPI = async (): Promise<TagDTO[]> => {
    const res = await apiClient.get('/api/v1/tag/tags');
    // console.log('[trackService] getAllTags response:', res.data);
    return res.data as TagDTO[];
};
