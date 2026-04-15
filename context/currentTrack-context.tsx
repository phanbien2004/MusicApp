<<<<<<< Updated upstream
import { TrackContentType } from '@/services/searchService';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';
=======
import { createStompClient } from '@/api/apiSocket';
import { USER_ID_STORAGE_KEY } from '@/constants/storageKeys';
import { createInteractionAPI } from '@/services/interactionService';
import { setJamContext } from '@/services/jamService';
import { savePlayerStateAPI } from '@/services/playerStateService';
import { TrackContentType } from '@/services/searchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useJam } from './jam-context';
>>>>>>> Stashed changes

export interface CurrentTrack extends TrackContentType {
    id: number;
    trackUrl: string | any;
}

interface CurrentTrackContextType {
    currentTrack: CurrentTrack | null;
    setCurrentTrack: (track: CurrentTrack) => void;
    player: AudioPlayer;
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

const MIN_LISTEN_SECONDS = 30;
const MIN_LISTEN_RATIO = 0.5;

const parseStoredNumber = (value: string | null) => {
    if (!value) return null;

    try {
        const parsedValue = JSON.parse(value);
        const normalizedValue = typeof parsedValue === 'number' ? parsedValue : Number(parsedValue);
        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
    } catch {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
    }
};

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrackState] = useState<CurrentTrack | null>(null);
    const player = useAudioPlayer(currentTrack?.trackUrl || null);
<<<<<<< Updated upstream
=======
    const status = useAudioPlayerStatus(player);
    const { activeSession } = useJam();

    const clientRef = useRef<ReturnType<typeof createStompClient> | null>(null);
    const listenedSecsRef = useRef(0);
    const prevTimeRef = useRef(0);
    const listenCountedRef = useRef(false);
    const currentTrackIdRef = useRef<number | null>(null);
    const memberIdRef = useRef<number | null>(null);

    useEffect(() => {
        const hydrateMemberId = async () => {
            const storedMemberId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
            memberIdRef.current = parseStoredNumber(storedMemberId);
        };

        hydrateMemberId();
    }, []);
>>>>>>> Stashed changes

    useEffect(() => {
        if (currentTrack?.trackUrl) {
            console.log('CurrentTrackProvider - New track URL:', currentTrack.trackUrl);
            console.log('CurrentTrackProvider - id:', currentTrack.id);
            const playTimeout = setTimeout(() => {
                player.play();
            }, 150);
            return () => clearTimeout(playTimeout);
        }
    }, [currentTrack?.id, currentTrack?.trackUrl, player]);

<<<<<<< Updated upstream
    const handleSetTrack = (track: CurrentTrack) => {
        setCurrentTrack(track);
=======
    useEffect(() => {
        if (currentTrack?.id !== currentTrackIdRef.current) {
            listenedSecsRef.current = 0;
            prevTimeRef.current = 0;
            listenCountedRef.current = false;
            currentTrackIdRef.current = currentTrack?.id ?? null;
        }
    }, [currentTrack?.id]);

    useEffect(() => {
        if (!status.playing || !currentTrack?.id) return;

        const currentTime = status.currentTime;
        const previousTime = prevTimeRef.current;
        const delta = currentTime - previousTime;

        // Only count forward playback time to avoid seek/loop inflating listens.
        if (delta > 0 && delta <= 2) {
            listenedSecsRef.current += delta;
        }
        prevTimeRef.current = currentTime;

        if (listenCountedRef.current) return;

        const trackDuration = status.duration > 0 ? status.duration : currentTrack.duration ?? 0;
        const meetsMinDuration = listenedSecsRef.current >= MIN_LISTEN_SECONDS;
        const meetsRatio = trackDuration > 0
            ? listenedSecsRef.current >= trackDuration * MIN_LISTEN_RATIO
            : false;

        if (meetsMinDuration && meetsRatio) {
            listenCountedRef.current = true;
            createInteractionAPI({
                trackId: currentTrack.id,
                interactionType: 'PLAY',
                listenDuration: Math.floor(listenedSecsRef.current),
            }).catch(() => { });
        }
    }, [currentTrack?.duration, currentTrack?.id, status.currentTime, status.duration, status.playing]);

    useEffect(() => {
        const trackId = currentTrack?.id;

        return () => {
            if (!trackId || listenCountedRef.current || listenedSecsRef.current <= 5) {
                return;
            }

            createInteractionAPI({
                trackId,
                interactionType: 'SKIP',
                listenDuration: Math.floor(listenedSecsRef.current),
            }).catch(() => { });
        };
    }, [currentTrack?.id]);

    useEffect(() => {
        const memberId = memberIdRef.current;
        if (!currentTrack?.id || !memberId) return;
        if (status.playing || status.currentTime <= 0) return;

        savePlayerStateAPI({
            trackId: currentTrack.id,
            currentSeekPosition: Math.floor(status.currentTime),
            playlistId: 0,
            albumId: 0,
            jamId: activeSession?.sessionId,
            memberId,
        }).catch(() => { });
    }, [activeSession?.sessionId, currentTrack?.id, status.currentTime, status.playing]);

    useEffect(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const handleSetTrack = async (track: CurrentTrack, isReceiptFromJam: boolean) => {
        if (isReceiptFromJam) {
            setCurrentTrackState(track);
            return;
        }

        if (!activeSession) {
            setCurrentTrackState(track);
            return;
        }

        if (!clientRef.current) {
            clientRef.current = createStompClient();
        }

        const client = clientRef.current;
        const sendTrackUpdate = () => {
            if (activeSession.isHost) {
                client.publish({
                    destination: '/app/jam/track',
                    body: JSON.stringify({
                        jamId: activeSession.sessionId,
                        trackId: track.id,
                    }),
                });
            }

            client.publish({
                destination: '/app/jam/notification',
                body: JSON.stringify({
                    jamId: activeSession.sessionId,
                    trackId: track.id,
                    notificationType: 'JAM_INTERACTION',
                    interactionType: 'PICK',
                }),
            });
        };

        if (client.connected) {
            sendTrackUpdate();
        } else {
            client.onConnect = () => {
                sendTrackUpdate();
            };
            client.activate();
        }

        if (!activeSession.isHost) {
            Alert.alert('Request sent. Awaiting host approval.');
        }

        if (activeSession.sessionId && activeSession.isHost) {
            try {
                await setJamContext(activeSession.sessionId, track.id, null, null);
            } catch (error) {
                console.error('Loi SETJAMCONTEXT: ', error);
            }
        }
>>>>>>> Stashed changes
    };

    return (
        <CurrentTrackContext.Provider value={{
            currentTrack,
            setCurrentTrack: handleSetTrack,
            player,
        }}>
            {children}
        </CurrentTrackContext.Provider>
    );
};

export const useCurrentTrack = () => useContext(CurrentTrackContext);
