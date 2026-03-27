import { TrackContentType } from '@/services/searchService';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CurrentTrack extends TrackContentType {
    trackURL: string | any; // Thêm 'any' để hỗ trợ cả link HTTP và require() local
}

interface CurrentTrackContextType {
    currentTrack: CurrentTrack | null;
    setCurrentTrack: (track: CurrentTrack) => void;
    player: AudioPlayer; // Truyền player ra ngoài
    // ĐÃ XÓA: isPlaying, setIsPlaying, position, duration
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);

    // Khởi tạo Player
    const player = useAudioPlayer(currentTrack?.trackURL || null);

    // LOGIC AUTO-PLAY AN TOÀN KHI ĐỔI BÀI HÁT
    useEffect(() => {
        if (currentTrack?.trackURL) {
            // Dùng setTimeout (khoảng 100-200ms) để đảm bảo 
            // Audio Engine đã nạp xong source mới trước khi ra lệnh Play
            const playTimeout = setTimeout(() => {
                player.play();
            }, 150); 
            
            return () => clearTimeout(playTimeout);
        }
    }, [currentTrack?.trackURL]);

    // Hàm set track mới siêu gọn nhẹ
    const handleSetTrack = (track: CurrentTrack) => {
        setCurrentTrack(track);
        // Không cần setPosition(0) hay setIsPlaying(true) nữa, expo-audio tự lo!
    };

    return (
        <CurrentTrackContext.Provider value={{ 
            currentTrack, 
            setCurrentTrack: handleSetTrack, 
            player 
        }}>
            {children}
        </CurrentTrackContext.Provider>
    );
};

export const useCurrentTrack = () => useContext(CurrentTrackContext);