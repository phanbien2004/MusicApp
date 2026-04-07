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
