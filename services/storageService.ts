import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";


// 1. Xin Presigned URL từ Backend
export const getPresignedUploadUrl = async (fileName: string, fileType: string, bucketName: string) => {
    console.log("Get PresignedUploadUrl: ", `${BASE_URL}/upload`);
    const res = await apiClient.post(`${BASE_URL}/upload`, {
        fileName,
        fileType,
        bucketName
    });
    console.log("Response GetPresignedUploadUrl: ", res);
    return res.data;
};

// 2. Upload file trực tiếp lên MinIO
export const uploadFileToMinIO = async (fileUri: string, fileType: string, presignedUrl: string) => {
    console.log("Put FileTiMinIO");
    const response = await fetch(fileUri);
    console.log(response);
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
