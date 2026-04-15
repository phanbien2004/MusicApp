import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { File } from 'expo-file-system';
import { fetch } from "expo/fetch";


// Hàm chuẩn hóa tên file: Không dấu, khoảng trắng thay bằng gạch ngang
function sanitizeFileName(name: string) {
    if(!name) return `file-${Date.now()}`;
    let str = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.replace(/[^a-zA-Z0-9.-]/g, '-');
    str = str.replace(/-+/g, '-');
    str = str.replace(/^-+|-+$/g, '');
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
    console.log("Put File To MinIO via New FileSystem API...");
    
    // Đổi localhost thành hostname IP để React Native kết nối được backend local minio
    let finalUploadUrl = presignedUrl;
    try {
        const baseIp = new URL(BASE_URL).hostname;
        finalUploadUrl = finalUploadUrl.replace('localhost', baseIp);
    } catch {}

    // BƯỚC QUAN TRỌNG: Tạo đối tượng File từ đường dẫn local
    const localFile = new File(fileUri);

    // Dùng hàm expo/fetch để đẩy file. 
    // Hệ thống sẽ tự hiểu localFile là 1 luồng nhị phân (Native Blob) và đẩy đi chuẩn 100%
    const uploadRes = await fetch(finalUploadUrl, {
        method: 'PUT',
        headers: {
            "Content-Type": fileType,
        },
        body: localFile // Ném thẳng object file vào đây!
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
        throw new Error(`Lỗi upload MinIO: Status ${uploadRes.status} - ${uploadRes.body}`);
    }
    return true;
};