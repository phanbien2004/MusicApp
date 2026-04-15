// import { BASE_URL } from '@/constants/baseURL';
// import AsyncStorage from '@react-native-async-storage/async-storage';

import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { contributorDTO } from "../trackService";

// export interface AdminArtistProfilePreviewDTO {
//     id: number;
//     stageName?: string;
//     // Hỗ trợ trường hợp Backend dùng lại ArtistProfilePreviewDTO (trường name)
//     name?: string; 
//     avatarUrl: string;
//     status: string;
//     createdAt: string; 
// }

// export interface AdminArtistProfileDTO {
//     id: number;
//     stageName: string;
//     bio: string;
//     avatarUrl: string;
//     coverUrl: string;
//     status: string;
//     createdAt: string;
// }

// export interface tagDTO {
//     id: number;
//     name: string;
// }

// export interface TrackPendingDTO {
//     trackId: number;
//     title: string;
//     duration: number;
//     trackUrl: string;
//     tag: tagDTO[];
// }

// export const getAllPendingArtistProfilesAPI = async (): Promise<AdminArtistProfilePreviewDTO[]> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/admin/getAllPendingArtistProfile`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         throw new Error("Failed to fetch pending artist profiles");
//     }

//     return res.json();
// }

// export const getArtistProfileByIdAPI = async (id: number | string): Promise<AdminArtistProfileDTO> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/admin/getArtistProfile/${id}`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         throw new Error("Failed to fetch artist profile details");
//     }

//     return res.json();
// }

// export const approveArtistProfileAPI = async (id: number | string): Promise<void> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/admin/approveArtistProfile/${id}`, {
//         method: 'PUT',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         throw new Error("Failed to approve artist profile");
//     }
// }

// export const rejectArtistProfileAPI = async (id: number | string): Promise<void> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/admin/rejectArtistProfile/${id}`, {
//         method: 'PUT',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         throw new Error("Failed to reject artist profile");
//     }
// }

// export const createTagAPI = async (name: string, displayName: string, description: string, parentTagId: number | null = null): Promise<string> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/tag/createTag`, {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ name, displayName, description, parentTagId: parentTagId })
//     });
//     if (!res.ok) throw new Error("Failed to create tag");
//     return res.text();
// }

// export const deleteTagAPI = async (id: number): Promise<string> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/tag/deleteTag?id=${id}`, {
//         method: 'DELETE',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });
//     if (!res.ok) throw new Error("Failed to delete tag");
//     return res.text();
// }

// export const updateTagAPI = async (id: number, name: string, displayName: string, description: string, parentTagId: number | null = null): Promise<string> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/tag/updateTag?id=${id}`, {
//         method: 'PUT',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ name, displayName, description, parentTagId: parentTagId })
//     });
//     if (!res.ok) throw new Error("Failed to update tag");
//     return res.text();
// }

// export const getTagByIdAPI = async (id: number): Promise<any> => {
//     const token = await AsyncStorage.getItem('accessToken');
//     const res = await fetch(`${BASE_URL}/api/v1/tag/getTag?id=${id}`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });
//     if (!res.ok) throw new Error("Failed to get tag details");
//     return res.json();
// }

// Track ReView API

export interface tagDTO {
    id: number;
    displayName: string;
}

export interface ContributorDTO {
    id: number;
    name: string;
    role: "OWNER" | "FEATURED" | "PRODUCER";
}

export interface TrackPendingDTO {
    trackId: number;
    title: string;
    duration: number;
    trackUrl: string;
    thumbnailUrl: string;
    tags: tagDTO[];
    contributors: contributorDTO[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

export const getAllPendingTrackAPI = async (index: number, size: number): Promise<TrackPendingDTO[]> => {
    console.log("Fetching Pending Tracks with page:", index, "and size:", size);
    console.log(`GET All Pending Tracks: ${BASE_URL}/api/v1/admin/getAllPendingTrack?index=${index}&size=${size}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/admin/getAllPendingTrack`, {
        params: {index, size}
    });
    const PendingTracsksData = res.data?.content as TrackPendingDTO[];
    console.log("Response Get All Pending Tracks: ", PendingTracsksData);
    return PendingTracsksData;
}

export interface PendingAlbumDTO {
    id: number;
    title: string;
    thumbnailUrl: string;
    releaseYear: number;
}

export interface PendingAlbumPageDTO {
    content: PendingAlbumDTO[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

export interface AlbumTrackDTO {
    id: number;
    title: string;
    trackUrl: string;
    thumbnailUrl: string;
    duration: number;
    contributors: contributorDTO[];
}

export const getAllPendingAlbumsAPI = async (pageNumber: number, pageSize: number): Promise<PendingAlbumPageDTO> => {
    console.log(`GET Pending Albums: ${BASE_URL}/api/v1/album/albums?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/album/albums`, {
        params: { pageNumber, pageSize },
    });
    console.log("Response Get All Pending Albums: ", res.data);
    return res.data as PendingAlbumPageDTO;
};

export const getAlbumTracksAPI = async (albumId: number): Promise<AlbumTrackDTO[]> => {
    console.log(`GET Album Tracks: ${BASE_URL}/api/v1/album-track/${albumId}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/album-track/${albumId}`);
    console.log("Response Get Album Tracks: ", res.data);
    return res.data as AlbumTrackDTO[];
};

export const approveAlbumAPI = async (albumId: number) => {
    console.log(`PUT Approve Album: ${BASE_URL}/api/v1/admin/approveAlbum/${albumId}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/approveAlbum/${albumId}`);
    console.log("Response Approve Album: ", res.data);
    return res.data;
};

export const rejectAlbumAPI = async (albumId: number) => {
    console.log(`PUT Reject Album: ${BASE_URL}/api/v1/admin/rejectAlbum/${albumId}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/rejectAlbum/${albumId}`);
    console.log("Response Reject Album: ", res.data);
    return res.data;
};

export const approveTrackAPI = async (trackId: number) => {
    console.log("Approving track with ID:", trackId);
    console.log(`PUT Approve Track: ${BASE_URL}/api/v1/admin/approveTrack/${trackId}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/approveTrack/${trackId}`);
    console.log("Response Approve Track: ", res.data);
    return res.data;
};

export const rejectTrackAPI = async (trackId: number) => {
    console.log("Rejecting track with ID:", trackId);
    console.log(`PUT Reject Track: ${BASE_URL}/api/v1/admin/rejectTrack/${trackId}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/rejectTrack/${trackId}`);
    console.log("Response Reject Track: ", res.data);
    return res.data;
};      

// Artist Verification API

export interface AllPendingArtistProfilePreviewDTO {
    id: number;
    stageName: string;
    avatarUrl: string;
    status: string;
    createdAt: string;
}

export interface ArtistProfilelDTO {
    id: number;
    stageName: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    status: string;
    createdAt: string;
}

export const getAllPendingArtistProfilesAPI = async (): Promise<AllPendingArtistProfilePreviewDTO[]> => {
    console.log(`GET All Pending Artist Profiles: ${BASE_URL}/api/v1/admin/getAllPendingArtistProfile`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/admin/getAllPendingArtistProfile`);
    console.log("Response Get All Pending Artist Profiles: ", res.data);
    return res.data;
}

export const getArtistProfileByIdAPI = async (id: number | string): Promise<ArtistProfilelDTO> => {
    console.log(`GET Artist Profile By ID: ${BASE_URL}/api/v1/admin/getArtistProfile/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/admin/getArtistProfile/${id}`);
    console.log("Response Get Artist Profile By ID: ", res.data);
    return res.data;
}

export const approveArtistProfileAPI = async (id: number | string) => {
    console.log(`PUT Approve Artist Profile: ${BASE_URL}/api/v1/admin/approveArtistProfile/${id}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/approveArtistProfile/${id}`);
    console.log("Response Approve Artist Profile: ", res.data);
    return res.data;
}

export const rejectArtistProfileAPI = async (id: number | string) => {
    console.log(`PUT Reject Artist Profile: ${BASE_URL}/api/v1/admin/rejectArtistProfile/${id}`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/admin/rejectArtistProfile/${id}`);
    console.log("Response Reject Artist Profile: ", res.data);
    return res.data;
}

export const getTagsAPI = async () => {
    console.log("GET ALL TAG");
    const res = await apiClient.get('/api/v1/tag/tags');
    console.log('RESPONSE GET ALL TAG: ', res.data);
    return res.data
}
export interface TagDTO {
    id: number;
    displayName: string;
}
export const addTagAPI = async (tmpName: string) : Promise<TagDTO> => {
    console.log("POST CREATE TAG");
    const res= await apiClient.post(`api/v1/tag/createTag`, {
        name: "AddTag", displayName: tmpName, description: "AddTag", parentTagId: 0
    })
    console.log("RESPONSE CREATE NEW TAG: ", res.data);
    return res.data as TagDTO   
}

export const deleteTagAPI = async (idTagDelete: number) => {
    console.log("DELETE TAG");
    const res = await apiClient.delete(`api/v1/tag/deleteTag?id=${idTagDelete}`);
    console.log("RESPONSE DELETE TAG", res);
    return res
}
