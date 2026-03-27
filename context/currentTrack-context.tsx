import { TrackContentType } from '@/services/searchService';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CurrentTrack extends TrackContentType {
    trackURL: string | any;
}

interface CurrentTrackContextType {
    currentTrack: CurrentTrack | null;
    setCurrentTrack: (track: CurrentTrack) => void;
    player: AudioPlayer;
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const player = useAudioPlayer(currentTrack?.trackURL || null);

    useEffect(() => {
        if (currentTrack?.trackURL) {
            const playTimeout = setTimeout(() => {
                player.play();
            }, 150); 
            return () => clearTimeout(playTimeout);
        }
    }, [currentTrack?.trackURL]);

    const handleSetTrack = (track: CurrentTrack) => {
        setCurrentTrack(track);
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