import React, { createContext, useContext, useState } from 'react';

// 1. Định nghĩa cấu trúc dữ liệu bài hát
interface Track {
    title: string;
    artist: string;
    duration: string;
}

// 2. Định nghĩa các giá trị mà Context sẽ cung cấp
interface PlayerContextType {
    // Phần quản lý Tab (Giao diện)
    lastActiveTab: string;
    setLastActiveTab: (tab: string) => void;

    // Phần quản lý Nhạc (Dữ liệu)
    currentTrack: Track;
    handleSetTrack: (title: string, artist: string, duration: string) => void;
}

// 3. Khởi tạo Context với giá trị mặc định
const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    // State cho Tab
    const [lastActiveTab, setLastActiveTab] = useState('home');

    // State cho Bài hát (Khởi tạo bài mặc định)
    const [currentTrack, setCurrentTrack] = useState<Track>({
        title: 'Em của ngày hôm qua',
        artist: 'Sơn Tùng MTP',
        duration: '3:36',
    });

    // Hàm cập nhật bài hát mới
    const handleSetTrack = (title: string, artist: string, duration: string) => {
        setCurrentTrack({ title, artist, duration });
    };

    return (
        <PlayerContext.Provider 
            value={{ 
                lastActiveTab, 
                setLastActiveTab, 
                currentTrack, 
                handleSetTrack 
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

// 4. Hook để sử dụng trong các Component
export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};