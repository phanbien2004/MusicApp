import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

import * as FileSystem from 'expo-file-system/legacy';

// 1. Xin Presigned URL từ Backend
export const getPresignedUploadUrl = async (fileName: string, fileType: string, bucketName: string) => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/storage/upload`, {
        fileName,
        fileType,
        bucketName
    });
    return res.data;
};

// 2. Upload file trực tiếp lên MinIO
export const uploadFileToMinIO = async (fileUri: string, fileType: string, presignedUrl: string) => {
    const uploadRes = await FileSystem.uploadAsync(presignedUrl, fileUri, {
        httpMethod: 'PUT',
        headers: {
            "Content-Type": fileType,
        },
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
        throw new Error("Lỗi khi upload MinIO: Status " + uploadRes.status);
    }
    return true;
};
