import React, { createContext, useContext, useState } from 'react';

interface PlayerContextType {
    lastActiveTab: string;
    setLastActiveTab: (tab: string) => void;
}

const PlayerContext = createContext<PlayerContextType>({
    lastActiveTab: 'home',
    setLastActiveTab: () => { },
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [lastActiveTab, setLastActiveTab] = useState('home');
    return (
        <PlayerContext.Provider value={{ lastActiveTab, setLastActiveTab }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
