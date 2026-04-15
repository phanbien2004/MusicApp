import { BASE_URL } from '@/constants/baseURL';
import { refreshTokenAPI } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface FailedRequest {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedRequestsQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else if (token) prom.resolve(token);
    });
    failedRequestsQueue = [];
};

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

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const curRefreshToken = await AsyncStorage.getItem('refreshToken');
                if (!curRefreshToken) throw new Error("No Refresh Token");

                const response = await refreshTokenAPI(curRefreshToken);
                const { accessToken: newAT, refreshToken: newRT } = response;

                await AsyncStorage.setItem('accessToken', newAT);
                if (newRT) await AsyncStorage.setItem('refreshToken', newRT);

                processQueue(null, newAT);
                originalRequest.headers.Authorization = `Bearer ${newAT}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

import { jwtDecode } from 'jwt-decode';

// --- PHẦN 2: SMART STOMP CLIENT (WEBSOCKET) ---
export const createStompClient = () => {
    // Chuyển http:// thành ws://
    const wsUrl = `${BASE_URL.replace(/^http/, 'ws')}/ws`;
    
    const client = new Client({
        brokerURL: wsUrl,
        webSocketFactory: () => new WebSocket(wsUrl) as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
    });

    client.beforeConnect = async () => {
        try {
            let latestToken = await AsyncStorage.getItem('accessToken');
            
            if (latestToken) {
                const decoded: any = jwtDecode(latestToken);
                const currentTime = Date.now() / 1000;
                
                if (decoded.exp && decoded.exp - currentTime < 30) {
                    console.log("STOMP: Token gần/đã hết hạn, tự động refresh...");
                    const curRefreshToken = await AsyncStorage.getItem('refreshToken');
                    if (curRefreshToken) {
                        const response = await refreshTokenAPI(curRefreshToken);
                        latestToken = response.accessToken;
                        await AsyncStorage.setItem('accessToken', latestToken);
                        if (response.refreshToken) {
                            await AsyncStorage.setItem('refreshToken', response.refreshToken);
                        }
                    }
                }
            }

            client.connectHeaders = {
                'Authorization': `Bearer ${latestToken}`,
                'authorization': `Bearer ${latestToken}`,
            };
        } catch (e) {
            console.error("STOMP: Lỗi auto-refresh token beforeConnect", e);
        }
    };

    client.onStompError = (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
    };

    return client;
};