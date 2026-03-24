// context/PlayerContext.tsx
import { TrackContentType } from '@/services/searchService';
import React, { createContext, useContext, useState } from 'react';

// Cấu trúc một bài hát hoàn chỉnh để sẵn sàng cho Backend


interface CurrentTrackContextType {
    currentTrack: TrackContentType | null;
    setCurrentTrack: (track: TrackContentType) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<TrackContentType | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSetTrack = (track: TrackContentType) => {
        setCurrentTrack(track);
        setIsPlaying(true); // Tự động phát khi chọn bài mới
    };

    return (
        <CurrentTrackContext.Provider value={{ 
            currentTrack, 
            setCurrentTrack: handleSetTrack, 
            isPlaying, 
            setIsPlaying 
        }}>
            {children}
        </CurrentTrackContext.Provider>
    );
};

export const useCurrentTrack = () => useContext(CurrentTrackContext);