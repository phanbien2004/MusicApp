import apiClient from '@/api/apiClient';

export interface AlbumDraftPayload {
    title: string;
    thumbnailKey: string | null;
}

export interface AlbumDraftResponse {
    id: number;
    title: string;
    thumbnailUrl: string | null;
}

/** Bước 1: Tạo album draft với title, thumbnail và ngày phát hành */
export const submitAlbumDraftAPI = async (payload: AlbumDraftPayload) => {
    console.log('[albumService] submitAlbumDraft payload:', payload);
    const res = await apiClient.post('/api/v1/album/draft', payload);
    console.log('[albumService] submitAlbumDraft response:', res.data);
    return res.data as Number;
};

/** Bước 2: Submit album (gửi lên để review/publish) */
export const submitAlbumAPI = async (id: number): Promise<string> => {
    console.log('[albumService] submitAlbum id:', id);
    const res = await apiClient.put('/api/v1/album/submit', { id });
    console.log('[albumService] submitAlbum response:', res.data);
    return res.data as string;
};

export const submitTrackAlbumAPI = async (albumId: number, trackId: number, position: number): Promise<string> => {
    console.log('[albumService] submitTrackAlbum albumId:', albumId);
    console.log('[albumService] submitTrackAlbum trackId:', trackId);
    console.log('[albumService] submitTrackAlbum position:', position);
    const res = await apiClient.post('/api/v1/album-track', { albumId, trackId, position });
    console.log('[albumService] submitTrackAlbum response:', res.data);
    return res.data as string;
};
