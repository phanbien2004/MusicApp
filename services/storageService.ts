import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

// 1. Xin Presigned URL từ Backend
export const getPresignedUploadUrl = async (fileName: string, fileType: string, bucketName: string) => {
    const res = await apiClient.post(`${BASE_URL}/api/v1/storage/upload`, {
        fileName,
        fileType,
        bucketName
    });
    return res.data;
};

// 2. Upload file trực tiếp lên MinIO (Sử dụng fetch thuần để tránh kẹp Token)
export const uploadFileToMinIO = async (fileUri: string, fileType: string, presignedUrl: string) => {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Đẩy PUT request thẳng lên MinIO
    const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
            "Content-Type": fileType, // trùng với fileType lúc lấy Presigned URL
        },
        body: blob,
    });

    if (!uploadRes.ok) {
        throw new Error("Lỗi khi upload MinIO: " + uploadRes.statusText);
    }
    return true;
};
