import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";


// Hàm chuẩn hóa tên file: Không dấu, khoảng trắng thay bằng gạch ngang
function sanitizeFileName(name: string) {
    if(!name) return `file-${Date.now()}`;
    let str = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.replace(/\s+/g, '-');
    return str;
}

// 1. Xin Presigned URL từ Backend
export const getPresignedUploadUrl = async (fileName: string, fileType: string, bucketName: string) => {
    const cleanName = sanitizeFileName(fileName);
    console.log("Get PresignedUploadUrl: ", `${BASE_URL}/api/v1/storage/upload`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/storage/upload`, {
        fileName: cleanName,
        fileType,
        bucketName
    });
    console.log("Response GetPresignedUploadUrl: ", res);
    return res.data;
};

// 2. Upload file trực tiếp lên MinIO
export const uploadFileToMinIO = async (fileUri: string, fileType: string, presignedUrl: string) => {
    console.log("Put File To MinIO");
    
    // Nếu backend chạy Minio ở localhost:9000, thay localhost bằng hostname chung để app thật gọi được
    let finalUploadUrl = presignedUrl;
    try {
        const baseIp = new URL(BASE_URL).hostname;
        finalUploadUrl = finalUploadUrl.replace('localhost', baseIp);
    } catch {}

    const response = await fetch(fileUri);
    const blob = await response.blob();
    const uploadRes = await fetch(presignedUrl, {
        headers: {
            "Content-Type": fileType,
        },
        method: "PUT",
        body: blob
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
        throw new Error("Lỗi khi upload MinIO: Status " + uploadRes.status);
    }
    return true;
};
