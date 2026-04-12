import { BASE_URL } from '@/constants/baseURL'; // Đảm bảo bạn có hằng số này
import { Client, IMessage } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

export const useJamSocket = (accessToken: string, jamSessionId: number) => {
    const [notification, setNotification] = useState<any>(null);
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!accessToken || !jamSessionId) return;

        // 1. Khởi tạo SockJS và Stomp
        const socket = new SockJS(`${BASE_URL}/ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`, // Khớp với WebSocketSecurityConfig.java
            },
            debug: (str) => console.log('STOMP DEBUG:', str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        // 2. Logic khi kết nối thành công
        client.onConnect = (frame) => {
            console.log('Connected to WebSocket!');

            // Đăng ký nhận thông báo từ Jam
            // Lưu ý: Khớp với "/jam/notification" + id bên Java của Biên
            const topic = `/jam/notification${jamSessionId}`; 
            
            client.subscribe(topic, (message: IMessage) => {
                if (message.body) {
                    const data = JSON.parse(message.body);
                    console.log('New Jam Notification:', data);
                    setNotification(data); // Cập nhật để hiển thị lên UI
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('STOMP Error:', frame.headers['message']);
        };

        client.activate();
        stompClientRef.current = client;

        // 3. Cleanup khi thoát màn hình
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                console.log('WebSocket Deactivated');
            }
        };
    }, [accessToken, jamSessionId]);

    return { notification };
};
