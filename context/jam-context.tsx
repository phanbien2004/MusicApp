import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ACTIVE_JAM_STORAGE_KEY = '@musicapp_active_jam_id';

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
    setActiveSession: (session: ActiveJamSession) => Promise<void>;
    clearActiveSession: () => Promise<void>;
}

const JamContext = createContext<JamContextType | undefined>(undefined);

export function JamProvider({ children }: { children: React.ReactNode }) {
    const [activeSession, setActiveSessionState] = useState<ActiveJamSession | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const appStateRef = useRef(AppState.currentState);
    const activeSessionRef = useRef<ActiveJamSession | null>(null);

    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    useEffect(() => {
        let isMounted = true;

        const hydrateActiveSession = async () => {
            try {
                const storedJamId = await AsyncStorage.getItem(ACTIVE_JAM_STORAGE_KEY);

                if (!isMounted || !storedJamId) {
                    return;
                }

                const normalizedSessionId = Number(storedJamId);

                if (Number.isFinite(normalizedSessionId) && normalizedSessionId > 0) {
                    setActiveSessionState({
                        sessionId: normalizedSessionId,
                    });
                } else {
                    await AsyncStorage.removeItem(ACTIVE_JAM_STORAGE_KEY);
                }
            } catch (error) {
                console.log('JamProvider hydrate failed:', error);
            } finally {
                if (isMounted) {
                    setIsHydrated(true);
                }
            }
        };

        hydrateActiveSession();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const handleAppStateChange = async (nextState: AppStateStatus) => {
            const previousState = appStateRef.current;
            appStateRef.current = nextState;

            if (previousState === 'active' && nextState === 'background' && activeSessionRef.current?.sessionId) {
                try {
                    setActiveSessionState(null);
                    await AsyncStorage.removeItem(ACTIVE_JAM_STORAGE_KEY);
                } catch (error) {
                    console.log('JamProvider clear on app exit failed:', error);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const setActiveSession = async (session: ActiveJamSession) => {
        const normalizedSessionId = Number(session.sessionId);
        const sessionCode = typeof session.sessionCode === 'string' ? session.sessionCode.trim() : '';

        const normalizedSession: ActiveJamSession = {
            ...session,
            sessionId: Number.isFinite(normalizedSessionId) && normalizedSessionId > 0
                ? normalizedSessionId
                : undefined,
            sessionCode: sessionCode || undefined,
        };

        setActiveSessionState(normalizedSession);
        if (normalizedSession.sessionId) {
            await AsyncStorage.setItem(ACTIVE_JAM_STORAGE_KEY, String(normalizedSession.sessionId));
        } else {
            await AsyncStorage.removeItem(ACTIVE_JAM_STORAGE_KEY);
        }
    };

    const clearActiveSession = async () => {
        setActiveSessionState(null);
        await AsyncStorage.removeItem(ACTIVE_JAM_STORAGE_KEY);
    };

    const value = useMemo(() => ({
        activeSession,
        isHydrated,
        setActiveSession,
        clearActiveSession,
    }), [activeSession, isHydrated]);

    return (
        <JamContext.Provider value={value}>
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
