import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface ActiveJamSession {
    sessionId?: number;
    sessionCode?: string;
    size?: number;
    isPrivate?: boolean;
    isHost?: boolean;
}

interface JamContextType {
    activeSession: ActiveJamSession | null;
    isHydrated: boolean;
    setActiveSession: (session: ActiveJamSession) => void;
    clearActiveSession: () => void;
}

const JamContext = createContext<JamContextType | undefined>(undefined);

export function JamProvider({ children }: { children: React.ReactNode }) {
    const [activeSession, setActiveSession] = useState<ActiveJamSession | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const handleSetActiveSession = (activeSession : ActiveJamSession) => {
        setActiveSession(activeSession);
        setIsHydrated(true)
    }

    const handleClearActiveSession = () => {
        setIsHydrated(true);
        setActiveSession(null);
    }

    return (
        <JamContext.Provider value={{
            activeSession,
            isHydrated,
            setActiveSession: handleSetActiveSession,
            clearActiveSession: handleClearActiveSession
        }}>
            {children}
        </JamContext.Provider>
    );
}

export function useJam() {
    const context = useContext(JamContext);
    if (!context) {
        throw new Error('useJam must be used within a JamProvider');
    }
    return context;
}
