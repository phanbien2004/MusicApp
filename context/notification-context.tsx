import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStompClient } from '@/api/apiSocket';
import { USER_ID_STORAGE_KEY } from '@/constants/storageKeys';
import { useAuth } from './auth-context';

export interface NotificationDTO {
    notificationId: number | null;
    jamSessionId: number | null;
    trackId: number | null;
    playlistId: number | null;
    friendRequestSenderId: number | null;
    message: string;
    type: "FRIEND_REQUEST"| "JAM_INVITE" | "JAM_JOIN" | "JAM_INTERACTION" | "SONG_RELEASING" | "PLAYLIST_COLLABORATION";
    createdAt: string;
}

interface NotificationContextType {
    notifications: NotificationDTO[];
    unreadCount: number;
    setNotifications: React.Dispatch<React.SetStateAction<NotificationDTO[]>>;
    markAllAsRead: () => void;
    dismissNotification: (id: number | string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAuth();
    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        let client: any = null;
        let subscription: any = null;

        const connectSocket = async () => {
            const userId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
            if (!userId) return;

            client = createStompClient();
            client.onConnect = () => {
                subscription = client.subscribe(`/user/${userId}/queue/notice`, (msg: any) => {
                    try {
                        const data = JSON.parse(msg.body);
                        console.log("Global Notification Received:", data);
                        setNotifications(prev => [data, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    } catch (error) {
                        console.error("❌ Error Parsing Notification JSON:", error);
                    }
                });
            };
            client.activate();
        };

        connectSocket();

        return () => {
            if (subscription) subscription.unsubscribe();
            if (client) client.deactivate();
        };
    }, [isLoggedIn]);

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    const dismissNotification = (id: number | string) => {
        setNotifications(prev => prev.filter(n => String(n.notificationId) !== String(id)));
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            setNotifications, 
            markAllAsRead, 
            dismissNotification 
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
