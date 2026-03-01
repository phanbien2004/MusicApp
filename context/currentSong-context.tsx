// context/PlayerContext.tsx
import React, { createContext, useContext, useState } from 'react';

// Cấu trúc một bài hát hoàn chỉnh để sẵn sàng cho Backend
export interface Song {
    id: string;
    title: string;
    artist: string;
    url: string;      
    artwork?: string;
    duration?: string;
}

interface CurrentSongContextType {
    currentSong: Song | null;
    setCurrentSong: (song: Song) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
}

const CurrentSongContext = createContext<CurrentSongContextType | undefined>(undefined);

export const CurrentSongProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSetSong = (song: Song) => {
        setCurrentSong(song);
        setIsPlaying(true); // Tự động phát khi chọn bài mới
    };

    return (
        <CurrentSongContext.Provider value={{ 
            currentSong, 
            setCurrentSong: handleSetSong, 
            isPlaying, 
            setIsPlaying 
        }}>
            {children}
        </CurrentSongContext.Provider>
    );
};

export const useCurrentSong = () => useContext(CurrentSongContext);