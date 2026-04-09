import { BASE_URL } from '@/constants/baseURL';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AdminArtistProfilePreviewDTO {
    id: number;
    stageName?: string;
    // Hỗ trợ trường hợp Backend dùng lại ArtistProfilePreviewDTO (trường name)
    name?: string; 
    avatarUrl: string;
    status: string;
    createdAt: string; 
}

export interface AdminArtistProfileDTO {
    id: number;
    stageName: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    status: string;
    createdAt: string;
}

export const getAllPendingArtistProfilesAPI = async (): Promise<AdminArtistProfilePreviewDTO[]> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/admin/getAllPendingArtistProfile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch pending artist profiles");
    }

    return res.json();
}

export const getArtistProfileByIdAPI = async (id: number | string): Promise<AdminArtistProfileDTO> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/admin/getArtistProfile/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch artist profile details");
    }

    return res.json();
}

export const approveArtistProfileAPI = async (id: number | string): Promise<void> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/admin/approveArtistProfile/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to approve artist profile");
    }
}

export const rejectArtistProfileAPI = async (id: number | string): Promise<void> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/admin/rejectArtistProfile/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to reject artist profile");
    }
}

export const createTagAPI = async (name: string, displayName: string, description: string, parentTagId: number | null = null): Promise<string> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/tag/createTag`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, displayName, description, parentTagId: parentTagId })
    });
    if (!res.ok) throw new Error("Failed to create tag");
    return res.text();
}

export const deleteTagAPI = async (id: number): Promise<string> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/tag/deleteTag?id=${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Failed to delete tag");
    return res.text();
}

export const updateTagAPI = async (id: number, name: string, displayName: string, description: string, parentTagId: number | null = null): Promise<string> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/tag/updateTag?id=${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, displayName, description, parentTagId: parentTagId })
    });
    if (!res.ok) throw new Error("Failed to update tag");
    return res.text();
}

export const getTagByIdAPI = async (id: number): Promise<any> => {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}/api/v1/tag/getTag?id=${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Failed to get tag details");
    return res.json();
}
