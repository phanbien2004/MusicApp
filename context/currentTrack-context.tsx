import { createStompClient } from '@/api/apiSocket';
import { USER_ID_STORAGE_KEY } from '@/constants/storageKeys';
import { createInteractionAPI } from '@/services/interactionService';
import { setJamContext } from '@/services/jamService';
import { getPlayerQueueAPI, savePlayerStateAPI } from '@/services/playerStateService';
import { TrackContentType } from '@/services/searchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useJam } from './jam-context';

export interface CurrentTrack extends TrackContentType {
    id: number;
    trackUrl: string | any;
}

export interface PlaybackContext {
    source: 'search' | 'playlist' | 'album' | 'artist' | 'queue' | 'jam';
    playlistId?: number;
    albumId?: number;
}

export interface SetTrackOptions extends PlaybackContext {
    trackPickedByUser?: boolean;
}

interface CurrentTrackContextType {
    currentTrack: CurrentTrack | null;
    setCurrentTrack: (
        track: CurrentTrack,
        isReceiptFromJam: boolean,
        options?: SetTrackOptions,
    ) => Promise<void>;
    player: AudioPlayer;
    queue: CurrentTrack[];
    queueCursor: number;
    activePlaybackContext: PlaybackContext | null;
    playNextInQueue: (options?: { userInitiated?: boolean }) => Promise<void>;
    playPreviousInQueue: () => Promise<void>;
    seekTo: (seconds: number) => Promise<void>;
    refreshQueue: (trackIdOverride?: number) => Promise<void>;
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

const PLAYER_QUEUE_LIMIT = 0;
const MIN_LISTEN_SECONDS = 30;
const MIN_LISTEN_RATIO = 0.5;
const MIN_SKIP_SECONDS = 5;

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

const normalizeTrack = (track: CurrentTrack | TrackContentType): CurrentTrack => ({
    ...track,
    id: track.id,
    title: track.title,
    thumbnailUrl: track.thumbnailUrl,
    duration: track.duration,
    contributors: track.contributors || [],
    trackUrl: (track as CurrentTrack).trackUrl || '',
});

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrackState] = useState<CurrentTrack | null>(null);
    const [queue, setQueue] = useState<CurrentTrack[]>([]);
    const [queueCursor, setQueueCursor] = useState(-1);
    const [activePlaybackContext, setActivePlaybackContext] = useState<PlaybackContext | null>(null);
    const player = useAudioPlayer(currentTrack?.trackUrl || null);
    const status = useAudioPlayerStatus(player);
    const { activeSession } = useJam();

    const clientRef = useRef<ReturnType<typeof createStompClient> | null>(null);
    const queueRef = useRef<CurrentTrack[]>([]);
    const queueCursorRef = useRef(-1);
    const playbackContextRef = useRef<PlaybackContext | null>(null);
    const listenedSecsRef = useRef(0);
    const prevTimeRef = useRef(0);
    const listenCountedRef = useRef(false);
    const currentTrackIdRef = useRef<number | null>(null);
    const memberIdRef = useRef<number | null>(null);
    const lastHandledFinishedTrackRef = useRef<number | null>(null);
    const suppressSkipForTrackIdRef = useRef<number | null>(null);
    const playNextInQueueRef = useRef<CurrentTrackContextType['playNextInQueue']>(async () => {});

    useEffect(() => {
        const hydrateMemberId = async () => {
            const storedMemberId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
            memberIdRef.current = parseStoredNumber(storedMemberId);
        };

        hydrateMemberId();
    }, []);

    const ensureMemberId = async () => {
        if (memberIdRef.current) {
            return memberIdRef.current;
        }

        const storedMemberId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        memberIdRef.current = parseStoredNumber(storedMemberId);
        return memberIdRef.current;
    };

    const refreshQueue = async (trackIdOverride?: number) => {
        try {
            const queueResponse = await getPlayerQueueAPI(PLAYER_QUEUE_LIMIT);
            const normalizedQueue = (queueResponse.content || []).map((item) =>
                normalizeTrack(item),
            );
            const activeTrackId = trackIdOverride ?? currentTrackIdRef.current;
            const nextQueueCursor = activeTrackId
                ? normalizedQueue.findIndex((item) => item.id === activeTrackId)
                : -1;

            queueRef.current = normalizedQueue;
            queueCursorRef.current = nextQueueCursor;
            setQueue(normalizedQueue);
            setQueueCursor(nextQueueCursor);
        } catch (error) {
            console.error('Failed to refresh player queue:', error);
            queueRef.current = [];
            queueCursorRef.current = -1;
            setQueue([]);
            setQueueCursor(-1);
        }
    };

    useEffect(() => {
        if (currentTrack?.trackUrl) {
            const playTimeout = setTimeout(() => {
                player.play();
            }, 150);

            return () => clearTimeout(playTimeout);
        }
    }, [currentTrack?.id, currentTrack?.trackUrl, player]);

    useEffect(() => {
        if (currentTrack?.id !== currentTrackIdRef.current) {
            listenedSecsRef.current = 0;
            prevTimeRef.current = 0;
            listenCountedRef.current = false;
            currentTrackIdRef.current = currentTrack?.id ?? null;
            lastHandledFinishedTrackRef.current = null;
        }
    }, [currentTrack?.id]);

    // 2. Tích lũy thời gian nghe thật (chỉ tính tiến tới, chặn tua) -> Bắn PLAY
    useEffect(() => {
        if (!status.playing || !currentTrack?.id) {
            return;
        }

        const currentTime = status.currentTime;
        const previousTime = prevTimeRef.current;
        const delta = currentTime - previousTime;

        if (delta > 0 && delta <= 2) {
            listenedSecsRef.current += delta;
        }
        prevTimeRef.current = currentTime;

        if (listenCountedRef.current) {
            return;
        }

        const trackDuration = status.duration > 0 ? status.duration : currentTrack.duration ?? 0;
        const requiredListenSeconds = trackDuration > 0
            ? Math.min(MIN_LISTEN_SECONDS, Math.max(MIN_SKIP_SECONDS, trackDuration * MIN_LISTEN_RATIO))
            : MIN_LISTEN_SECONDS;

        if (listenedSecsRef.current >= requiredListenSeconds) {
            listenCountedRef.current = true;
            createInteractionAPI({
                trackId: currentTrack.id,
                interactionType: 'PLAY',
                duration: Math.floor(listenedSecsRef.current),
            }).catch(() => { });
        }
    }, [currentTrack?.duration, currentTrack?.id, status.currentTime, status.duration, status.playing]);

    // 3. Logic xử lý SKIP nếu đổi bài mà chưa đủ ngưỡng PLAY
    useEffect(() => {
        const trackId = currentTrack?.id;

        return () => {
            if (!trackId) {
                return;
            }

            if (suppressSkipForTrackIdRef.current === trackId) {
                suppressSkipForTrackIdRef.current = null;
                return;
            }

            if (listenCountedRef.current || listenedSecsRef.current <= MIN_SKIP_SECONDS) {
                return;
            }

            createInteractionAPI({
                trackId,
                interactionType: 'SKIP',
                duration: Math.floor(listenedSecsRef.current), // Đã sửa từ listenDuration -> duration
            }).catch(() => { });
        };
    }, [currentTrack?.id]);

    // 4. Lưu vị trí PlayerState khi Pause
    useEffect(() => {
        const memberId = memberIdRef.current;
        if (!currentTrack?.id || !memberId) {
            return;
        }
        if (status.playing || status.currentTime <= 0 || status.didJustFinish) {
            return;
        }

        savePlayerStateAPI({
            trackId: currentTrack.id,
            currentSeekPosition: Math.floor(status.currentTime),
            playlistId: playbackContextRef.current?.playlistId ?? 0,
            albumId: playbackContextRef.current?.albumId ?? 0,
            memberId,
        }).catch(() => {});
    }, [currentTrack?.id, status.currentTime, status.didJustFinish, status.playing]);

    // 5. Cleanup STOMP Client khi unmount
    useEffect(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    // 6. Hàm xử lý Phát bài hát kết hợp với Jam WebSocket
    const playPreviousInQueue = async () => {
        if (!currentTrack?.id || queueCursorRef.current <= 0) {
            return;
        }

        const previousTrack = queueRef.current[queueCursorRef.current - 1];
        if (!previousTrack) {
            return;
        }

        suppressSkipForTrackIdRef.current = currentTrack.id;
        createInteractionAPI({
            trackId: currentTrack.id,
            interactionType: 'PREVIOUS',
            duration: Math.floor(status.currentTime),
        }).catch(() => { });

        await handleSetTrack(previousTrack, false, {
            ...(playbackContextRef.current || { source: 'queue' }),
            source: 'queue',
            trackPickedByUser: false,
        });
    };

    const playNextInQueue = async ({ userInitiated = false }: { userInitiated?: boolean } = {}) => {
        if (!currentTrack?.id) {
            return;
        }

        const candidateIndex = queueCursorRef.current >= 0 ? queueCursorRef.current + 1 : 0;
        const nextTrack = queueRef.current[candidateIndex];

        if (!nextTrack) {
            return;
        }

        suppressSkipForTrackIdRef.current = currentTrack.id;

        if (userInitiated) {
            createInteractionAPI({
                trackId: currentTrack.id,
                interactionType: 'SKIP',
                duration: Math.floor(status.currentTime),
            }).catch(() => { });
        }

        await handleSetTrack(nextTrack, false, {
            ...(playbackContextRef.current || { source: 'queue' }),
            source: 'queue',
            trackPickedByUser: false,
        });
    };

    playNextInQueueRef.current = playNextInQueue;

    const seekTo = async (seconds: number) => {
        await player.seekTo(seconds);

        if (!activeSession && currentTrack?.id) {
            createInteractionAPI({
                trackId: currentTrack.id,
                interactionType: 'JUMP',
                duration: Math.floor(seconds),
            }).catch(() => { });
        }
    };

    useEffect(() => {
        if (!currentTrack?.id || !status.didJustFinish || activeSession) {
            return;
        }

        if (lastHandledFinishedTrackRef.current === currentTrack.id) {
            return;
        }

        lastHandledFinishedTrackRef.current = currentTrack.id;
        suppressSkipForTrackIdRef.current = currentTrack.id;
        playNextInQueueRef.current({ userInitiated: false }).catch((error) => {
            console.error('Failed to advance queue:', error);
        });
    }, [activeSession, currentTrack?.id, status.didJustFinish]);

    const handleSetTrack = async (
        track: CurrentTrack,
        isReceiptFromJam: boolean,
        options?: SetTrackOptions,
    ) => {
        const normalizedTrack = normalizeTrack(track);

        if (isReceiptFromJam) {
            playbackContextRef.current = { source: 'jam' };
            setActivePlaybackContext({ source: 'jam' });
            queueRef.current = [];
            queueCursorRef.current = -1;
            setQueue([]);
            setQueueCursor(-1);
            setCurrentTrackState(normalizedTrack);
            return;
        }

        if (!activeSession) {
            const nextPlaybackContext: PlaybackContext = {
                source: options?.source || playbackContextRef.current?.source || 'search',
                playlistId: options?.playlistId,
                albumId: options?.albumId,
            };

            playbackContextRef.current = nextPlaybackContext;
            setActivePlaybackContext(nextPlaybackContext);

            try {
                const memberId = await ensureMemberId();
                if (memberId) {
                    await savePlayerStateAPI({
                        trackId: normalizedTrack.id,
                        currentSeekPosition: 0,
                        playlistId: nextPlaybackContext.playlistId ?? 0,
                        albumId: nextPlaybackContext.albumId ?? 0,
                        memberId,
                    });
                    await refreshQueue(normalizedTrack.id);
                } else {
                    queueRef.current = [];
                    queueCursorRef.current = -1;
                    setQueue([]);
                    setQueueCursor(-1);
                }
            } catch (error) {
                console.error('Failed to sync player-state or queue:', error);
                queueRef.current = [];
                queueCursorRef.current = -1;
                setQueue([]);
                setQueueCursor(-1);
            }

            if (options?.trackPickedByUser !== false) {
                createInteractionAPI({
                    trackId: normalizedTrack.id,
                    interactionType: 'PICK',
                    duration: 0,
                }).catch(() => { });
            }

            setCurrentTrackState(normalizedTrack);
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
                        trackId: normalizedTrack.id,
                    }),
                });
            }

            client.publish({
                destination: '/app/jam/notification',
                body: JSON.stringify({
                    jamId: activeSession.sessionId,
                    trackId: normalizedTrack.id,
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
            return;
        }

        playbackContextRef.current = { source: 'jam' };
        setActivePlaybackContext({ source: 'jam' });

        // Giữ lại queue cho host để next/prev vẫn hoạt động,
        // chỉ cập nhật cursor đến vị trí bài vừa phát
        const newCursor = queueRef.current.findIndex((t) => t.id === normalizedTrack.id);
        if (newCursor >= 0) {
            queueCursorRef.current = newCursor;
            setQueueCursor(newCursor);
        } else {
            // Bài không có trong queue → Host pick album/playlist mới
            // Cần lưu state lên server với nhóm mới để lấy lại danh sách queue
            try {
                const memberId = await ensureMemberId();
                if (memberId) {
                    await savePlayerStateAPI({
                        trackId: normalizedTrack.id,
                        currentSeekPosition: 0,
                        playlistId: options?.playlistId ?? 0,
                        albumId: options?.albumId ?? 0,
                        memberId,
                    });
                    await refreshQueue(normalizedTrack.id);
                } else {
                    queueRef.current = [normalizedTrack];
                    queueCursorRef.current = 0;
                    setQueue(queueRef.current);
                    setQueueCursor(0);
                }
            } catch (error) {
                console.error('Failed to sync jam player-state or queue:', error);
                queueRef.current = [normalizedTrack, ...queueRef.current];
                queueCursorRef.current = 0;
                setQueue(queueRef.current);
                setQueueCursor(0);
            }
        }

        setCurrentTrackState(normalizedTrack);

        if (activeSession.sessionId) {
            try {
                await setJamContext(activeSession.sessionId, normalizedTrack.id, null, null);
            } catch (error) {
                console.error('Loi SETJAMCONTEXT: ', error);
            }
        }
    };

    return (
        <CurrentTrackContext.Provider
            value={{
                currentTrack,
                setCurrentTrack: handleSetTrack,
                player,
                queue,
                queueCursor,
                activePlaybackContext,
                playNextInQueue,
                playPreviousInQueue,
                seekTo,
                refreshQueue,
            }}
        >
            {children}
        </CurrentTrackContext.Provider>
    );
};

export const useCurrentTrack = () => useContext(CurrentTrackContext);
