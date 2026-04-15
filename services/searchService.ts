import apiClient from '@/api/apiClient';
import { BASE_URL } from "@/constants/baseURL";
import { CurrentTrack } from '@/context/currentTrack-context';

export interface SearchRequest {
    keyword: string;
    type: 'tracks' | 'albums' | 'members' | 'artists' | 'all';
    pageNumber: number;
    pageSize: number;
}

export interface TrackContentType {
    id: number,
    title: string,
    thumbnailUrl: string,
    duration: number,
    contributors: TrackContributorType[],
    trackUrl?: string,
}

export interface TrackContributorType {
    id: number,
    name: string,
}

export interface AlbumContentType {
    id: number,
    title: string,
    thumbnailUrl: string,
    releaseYear: number,
    artist?: {
        id: number,
        avatarUrl: string,
        name: string,
        followed: boolean
    }
}

export interface MemberContentType {
    id: number,
    avatarUrl: string,
    name: string,
    isFollowed?: boolean,
    friendStatus: "NONE" | "ACCEPTED" | "PENDING_SENT" | "PENDING_RECEIVED"
}

export interface ArtistContentType {
    id: number,
    avatarUrl: string,
    name: string,
    isFollowed: boolean,
    isFriend: boolean
}

export interface TrackPreviewDTOS {
    content: TrackContentType[],
    contributors: TrackContributorType[],
    currentPage: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}

export interface AlbumPreviewDTOS {
    content: AlbumContentType[],
    currentPage: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}

export interface MemberPreviewDTOS {
    content: MemberContentType[],
    currentPage: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}        

export interface ArtistPreviewDTOS {
    content: ArtistContentType[],
    currentPage: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}

export interface SearchResponse {
    trackPreviewDTOS?: TrackPreviewDTOS;
    albumPreviewDTOS?: AlbumPreviewDTOS;
    memberPreviewDTOS?: MemberPreviewDTOS;
    artistPreviewDTOS?: ArtistPreviewDTOS;
}

export async function searchAPI(data: SearchRequest): Promise<SearchResponse> {
    console.log(`${BASE_URL}/api/v1/search?keyword=${(data.keyword)}&type=${data.type}&pageNumber=${data.pageNumber}&pageSize=${data.pageSize}`)
    const res = await apiClient.get('/api/v1/search', {
        params: {
            keyword: data.keyword,
            type: data.type,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize
        }
    });
    console.log("Response SearchAPI: ", res.data);
    return res.data
}
export const searchTrack = async (id : any) : Promise<CurrentTrack> => {
    console.log("Search Track");
    const res = await apiClient.get(`/api/v1/track?trackId=${id}`);
    console.log("RESPONESE SEARCHTRACK", res.data);
    return res.data as CurrentTrack
}
