import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";


// 1. Xin Presigned URL từ Backend
export const getPresignedUploadUrl = async (fileName: string, fileType: string, bucketName: string) => {
    console.log("Get PresignedUploadUrl: ", `${BASE_URL}/api/v1/storage/upload`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/storage/upload`, {
        fileName,
        fileType,
        bucketName
    });
    console.log("Response GetPresignedUploadUrl: ", res);
    return res.data;
};

// 2. Upload file trực tiếp lên MinIO qua XMLHttpRequest (fetch bị treo với binary blob trên RN)
export const uploadFileToMinIO = async (fileUri: string, fileType: string, presignedUrl: string): Promise<boolean> => {
    // Thay toàn bộ host của presigned URL bằng host từ BASE_URL
    let finalUploadUrl = presignedUrl;
    try {
        const parsedPresigned = new URL(presignedUrl);
        const parsedBase = new URL(BASE_URL);
        parsedPresigned.hostname = parsedBase.hostname;
        finalUploadUrl = parsedPresigned.toString();
    } catch {}

    console.log("Put File To MinIO - Original URL:", presignedUrl);
    console.log("Put File To MinIO - Final URL:   ", finalUploadUrl);

    // Đọc file thành blob
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    console.log("Blob size:", blob.size, "type:", blob.type);

    // Dùng XMLHttpRequest thay fetch để tránh bị treo khi PUT binary data trên React Native
    return new Promise<boolean>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', finalUploadUrl, true);
        xhr.setRequestHeader('Content-Type', fileType);
        // MinIO cần Content-Length chính xác, không thì sẽ đóng kết nối giữa chừng
        xhr.setRequestHeader('Content-Length', String(blob.size));

        xhr.timeout = 120000; // 2 phút timeout

        xhr.onload = () => {
            console.log("MinIO XHR status:", xhr.status);
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(true);
            } else {
                reject(new Error("Lỗi khi upload MinIO: Status " + xhr.status));
            }
        };

        xhr.onerror = (e) => {
            console.error("MinIO XHR error:", e);
            reject(new Error("Network error khi upload MinIO"));
        };

        xhr.ontimeout = () => {
            reject(new Error("Upload MinIO timeout sau 2 phút"));
        };

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                console.log(`Upload progress: ${percent}%`);
            }
        };

        xhr.send(blob);
    });
};