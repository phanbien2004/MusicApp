import { BASE_URL } from '@/constants/baseURL';
import { refreshTokenAPI } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 1. Định nghĩa kiểu dữ liệu cho hàng đợi xử lý nhiều request cùng lúc
interface FailedRequest {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

// Hàm để giải phóng hàng đợi khi lấy được token mới
const processQueue = (error: any, token: string | null = null) => {
    failedRequestsQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedRequestsQueue = [];
};

// 2. Request Interceptor: Luôn tự động gắn Access Token vào Header
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Response Interceptor: "Đánh chặn" lỗi 401 để tự động Refresh Token
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response, 
    async (error) => {
        const originalRequest = error.config;
        const isUnauthorized = error.response?.status === 401;

        if (isUnauthorized && !originalRequest._retry) {
            
            // Trường hợp: Có nhiều request cùng lỗi, đẩy vào hàng đợi nằm chờ
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            // Đánh dấu request này đang được xử lý refresh để tránh lặp vô tận
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("=> Hệ thống phát hiện lỗi 401. Đang thử làm mới Token...");
                
                const curRefreshToken = await AsyncStorage.getItem('refreshToken');
                if (!curRefreshToken) throw new Error("Không tìm thấy Refresh Token.");

                // Gọi API refresh từ authService
                console.log("Truoc response");
                const response = await refreshTokenAPI(curRefreshToken);
                console.log("Sau response", response);
                
                // Giả định response trả về đúng cấu trúc { accessToken, refreshToken }
                const { accessToken: newAT, refreshToken: newRT } = response;

                // Cập nhật bộ nhớ máy
                await AsyncStorage.setItem('accessToken', newAT);
                if (newRT) await AsyncStorage.setItem('refreshToken', newRT);

                console.log("=> Làm mới Token thành công! Đang thực hiện lại yêu cầu cũ.");

                // Chạy lại các request đang nằm chờ trong hàng đợi
                processQueue(null, newAT);

                // Chạy lại chính yêu cầu hiện tại với Token mới
                originalRequest.headers.Authorization = `Bearer ${newAT}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                console.log("=> Refresh Token thất bại. Yêu cầu đăng nhập lại.");
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Nếu là lỗi khác (404, 500...) thì trả lỗi về cho Service xử lý
        return Promise.reject(error);
    }
);

export default apiClient;