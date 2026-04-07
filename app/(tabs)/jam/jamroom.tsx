import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { type CurrentTrack, useCurrentTrack } from '@/context/currentTrack-context';
import { useJam } from '@/context/jam-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createStompClient,
    deleteJamSessionAPI,
    inviteFriendsAPI,
    leaveJamSessionAPI,
    updateJamSessionAPI,
} from '@/services/jamService';
import { savePlayerStateAPI } from '@/services/playerStateService';
import { MemberContentType, searchAPI } from '@/services/searchService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    PanResponder,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ALBUM_SIZE = width * 0.62;
const SHEET_HEIGHT = height * 0.55;

// --- MOCK DATA (Giữ nguyên từ code của bạn) ---

const avatarColors = ['#555', '#6D28D9', '#4C1D95'];

const jamNotifications = [
    { id: '1', user: 'Iam HDA', action: 'jumped to 1:12 of the track', target: '"Em của ngày hôm qua"', hasCheck: true, time: '2m ago' },
    { id: '2', user: 'Iam HDA', action: 'joined the Jam with an invite code', target: '', hasCheck: false, time: '5m ago' },
    { id: '3', user: 'One Kill', action: 'was invited to the Jam by', target: 'Iam HDA', hasCheck: false, time: '8m ago' },
    { id: '4', user: 'Bien', action: 'add', target: '"Con mưa ngang" qua to playlist', hasCheck: false, time: '12m ago' },
];

const peopleCounts = ['02', '04', '06', '08', '10'];

type BottomSheet = 'none' | 'invite' | 'notification' | 'settings';
type JamNotificationItem = {
    id: string;
    user: string;
    action: string;
    target: string;
    hasCheck: boolean;
    time: string;
};

const parseStoredMemberId = (value: string | null) => {
    if (!value) {
        return null;
    }

    try {
        const parsedValue = JSON.parse(value);
        const normalizedValue = typeof parsedValue === 'number' ? parsedValue : Number(parsedValue);

        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
    } catch {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
    }
};

const normalizeSeekTime = (value: unknown) => {
    const normalizedValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(normalizedValue) && normalizedValue >= 0 ? normalizedValue : null;
};

const normalizeJamTrack = (value: unknown): CurrentTrack | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const source = value as Record<string, unknown>;
    const normalizedId = typeof source.id === 'number' ? source.id : Number(source.id);
    const trackUrl = typeof source.trackUrl === 'string' ? source.trackUrl.trim() : '';

    if (!Number.isFinite(normalizedId) || normalizedId <= 0 || !trackUrl) {
        return null;
    }

    const normalizedDuration = typeof source.duration === 'number' ? source.duration : Number(source.duration);
    const contributors = Array.isArray(source.contributors)
        ? source.contributors
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
            .map((item) => ({
                id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
                name: typeof item.name === 'string' ? item.name : '',
            }))
        : [];

    return {
        id: normalizedId,
        title: typeof source.title === 'string' ? source.title : '',
        thumbnailUrl: typeof source.thumbnailUrl === 'string' ? source.thumbnailUrl : '',
        duration: Number.isFinite(normalizedDuration) && normalizedDuration >= 0 ? normalizedDuration : 0,
        contributors,
        trackUrl,
    };
};

const waitForTrackSync = (delayMs = 250) => new Promise((resolve) => setTimeout(resolve, delayMs));

// --- CUSTOM HOOK CHO BOTTOM SHEET (Giữ nguyên) ---
function useBottomSheet(onClose: () => void) {
    const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const dragY = useRef(new Animated.Value(0)).current;

    const open = () => {
        dragY.setValue(0);
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const close = (onDone?: () => void) => {
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: SHEET_HEIGHT, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(onDone);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) dragY.setValue(gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 80 || gs.vy > 0.5) {
                    Animated.parallel([
                        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 200, useNativeDriver: true }),
                        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                    ]).start(onClose);
                } else {
                    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
                }
            },
        })
    ).current;

    return { slideAnim, overlayAnim, dragY, panResponder, open, close };
}

export default function JamRoomScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const { activeSession, clearActiveSession, isHydrated, setActiveSession } = useJam();
    const { currentTrack, player, setCurrentTrack } = useCurrentTrack()!;
    const isHost = Boolean(activeSession?.isHost);
    
    // UI States
    const [activeSheet, setActiveSheet] = useState<BottomSheet>('none');
    const [activityItems, setActivityItems] = useState<JamNotificationItem[]>(jamNotifications);
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [privacyMode, setPrivacyMode] = useState(false);
    const [maxPeople, setMaxPeople] = useState('04');
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);
    const [inviteQuery, setInviteQuery] = useState('');
    const [inviteResults, setInviteResults] = useState<MemberContentType[]>([]);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [settingsSubmitting, setSettingsSubmitting] = useState(false);
    const [finishSubmitting, setFinishSubmitting] = useState(false);

    // WebSocket & Player Refs
    const stompClientRef = useRef<any>(null);
    const playerRef = useRef(player);
    const currentTrackRef = useRef(currentTrack);
    const memberIdRef = useRef<number | null>(null);

    const { slideAnim, overlayAnim, dragY, panResponder, open, close } = useBottomSheet(() => setActiveSheet('none'));
    const activeSessionId = activeSession?.sessionId;
    const activeSessionCode = activeSession?.sessionCode;
    const activeSessionKey = activeSessionId ?? activeSessionCode;

    const persistPlayerState = useCallback(async (seekTimeOverride?: number) => {
        const memberId = memberIdRef.current;
        const trackId = currentTrackRef.current?.id;

        if (!activeSessionKey || !memberId || !trackId) {
            return;
        }

        try {
            await savePlayerStateAPI({
                currentSeekPosition: Math.max(0, Math.floor(seekTimeOverride ?? playerRef.current.currentTime ?? 0)),
                trackId,
                playlistId: 0,
                albumId: 0,
                memberId,
            });
        } catch (error) {
            console.log('JamRoom save player state failed:', error);
        }
    }, [activeSessionKey]);

    // Cập nhật playerRef để dùng trong WebSocket callback
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    useEffect(() => {
        currentTrackRef.current = currentTrack;
    }, [currentTrack]);

    useEffect(() => {
        let isMounted = true;

        const hydrateMemberId = async () => {
            try {
                const storedMemberId = await AsyncStorage.getItem('userId');

                if (isMounted) {
                    memberIdRef.current = parseStoredMemberId(storedMemberId);
                }
            } catch (error) {
                console.log('JamRoom member id hydrate failed:', error);
            }
        };

        hydrateMemberId();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (activeSession) {
            setPrivacyMode(Boolean(activeSession.isPrivate));
            setMaxPeople(String(activeSession.size ?? 4).padStart(2, '0'));
        }
    }, [activeSession]);

    useEffect(() => {
        if (isHydrated && !activeSessionKey) {
            router.navigate('/jam' as any);
        }
    }, [activeSessionKey, isHydrated, router]);

    // --- KẾT NỐI WEBSOCKET ---
    useEffect(() => {
        if (!accessToken || !activeSessionKey) return;

        const client = createStompClient(accessToken);
        
        client.onConnect = () => {
            console.log("JamRoom: WebSocket Connected");
            client.subscribe(`/jam/notification${activeSessionKey}`, (message) => {
                const data = JSON.parse(message.body);
                if (data.type === 'JAM_INTERACTION') {
                    const syncedTrack = normalizeJamTrack(data.track);
                    const syncedSeekTime = normalizeSeekTime(data.seekTime);

                    const syncPlayback = async () => {
                        if (syncedTrack && currentTrackRef.current?.id !== syncedTrack.id) {
                            setCurrentTrack(syncedTrack);
                            currentTrackRef.current = syncedTrack;
                            await waitForTrackSync();
                        }

                        if (syncedSeekTime !== null) {
                            try {
                                await playerRef.current.seekTo(syncedSeekTime);
                            } catch (error) {
                                console.log('JamRoom seek sync failed:', error);
                            }
                        }

                        if (data.interactionType === 'PLAY') {
                            playerRef.current.play();
                        } else if (data.interactionType === 'PAUSE') {
                            playerRef.current.pause();
                        }
                    };

                    void syncPlayback();
                }

                setActivityItems(prev => [{
                    id: `${Date.now()}`,
                    user: data.userName || data.memberName || 'Someone',
                    action: data.action || data.interactionType || 'updated the Jam',
                    target: data.trackTitle || '',
                    hasCheck: data.type === 'JAM_INTERACTION',
                    time: 'just now',
                }, ...prev].slice(0, 25));
            });
        };

        client.activate();
        stompClientRef.current = client;

        return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
    }, [accessToken, activeSessionKey, setCurrentTrack]);

    useEffect(() => {
        if (activeSheet !== 'invite' || !inviteQuery.trim()) {
            setInviteResults([]);
            setInviteLoading(false);
            return;
        }

        let isCancelled = false;
        const debounceTimer = setTimeout(async () => {
            try {
                setInviteLoading(true);
                const response = await searchAPI({
                    keyword: inviteQuery.trim(),
                    type: 'members',
                    pageNumber: 1,
                    pageSize: 12,
                });

                if (!isCancelled) {
                    setInviteResults(response.memberPreviewDTOS?.content ?? []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.log('Jam invite search error:', error);
                }
            } finally {
                if (!isCancelled) {
                    setInviteLoading(false);
                }
            }
        }, 350);

        return () => {
            isCancelled = true;
            clearTimeout(debounceTimer);
        };
    }, [activeSheet, inviteQuery]);

    // --- GỬI LỆNH ĐIỀU KHIỂN ---
    useEffect(() => {
        if (!activeSessionKey || !currentTrack?.id) {
            return;
        }

        void persistPlayerState();
    }, [activeSessionKey, currentTrack?.id, persistPlayerState]);

    useEffect(() => {
        if (!activeSessionKey || !currentTrack?.id || !player.playing) {
            return;
        }

        const intervalId = setInterval(() => {
            void persistPlayerState();
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [activeSessionKey, currentTrack?.id, player.playing, persistPlayerState]);

    const sendControl = (type: 'PLAY' | 'PAUSE' | 'SKIP' | 'PREVIOUS') => {
        const seekTime = player.currentTime;

        void persistPlayerState(seekTime);

        if (stompClientRef.current?.connected && activeSessionKey) {
            stompClientRef.current.publish({
                destination: `/app/jam.control/${activeSessionKey}`,
                body: JSON.stringify({
                    interactionType: type,
                    trackId: currentTrack?.id,
                    seekTime,
                    track: currentTrack ? {
                        id: currentTrack.id,
                        title: currentTrack.title,
                        thumbnailUrl: currentTrack.thumbnailUrl,
                        duration: currentTrack.duration,
                        contributors: currentTrack.contributors,
                        trackUrl: typeof currentTrack.trackUrl === 'string' ? currentTrack.trackUrl : '',
                    } : null,
                })
            });
        }
    };

    const handleTogglePlay = () => {
        if (player.playing) {
            player.pause();
            sendControl('PAUSE');
        } else {
            player.play();
            sendControl('PLAY');
        }
    };

    const handleSaveSettings = async () => {
        if (!isHost || !activeSessionId || settingsSubmitting || !activeSession) {
            return;
        }

        try {
            setSettingsSubmitting(true);
            await updateJamSessionAPI(activeSessionId, Number(maxPeople), !privacyMode);
            await setActiveSession({
                ...activeSession,
                size: Number(maxPeople),
                isPrivate: privacyMode,
            });
            Alert.alert('Saved', 'Jam settings updated.');
        } catch {
            Alert.alert('Error', 'Could not update Jam settings.');
        } finally {
            setSettingsSubmitting(false);
        }
    };

    const handleSendInvites = async () => {
        if (!isHost || !activeSessionId || inviteSubmitting) {
            return;
        }

        const memberIds = [...invitedIds]
            .map(id => Number(id))
            .filter(id => Number.isFinite(id) && id > 0);

        if (!memberIds.length) {
            Alert.alert('Invite', 'Select at least one member.');
            return;
        }

        try {
            setInviteSubmitting(true);
            await inviteFriendsAPI(activeSessionId, memberIds);
            Alert.alert('Sent', 'Invitations sent successfully.');
            setInvitedIds(new Set());
            setInviteQuery('');
            setInviteResults([]);
        } catch {
            Alert.alert('Error', 'Could not send invites.');
        } finally {
            setInviteSubmitting(false);
        }
    };

    const handleFinishJam = async () => {
        if (finishSubmitting) {
            return;
        }

        try {
            setFinishSubmitting(true);

            if (isHost) {
                if (!activeSessionId) {
                    throw new Error('Missing jam session id');
                }

                await deleteJamSessionAPI(activeSessionId);
            } else {
                await leaveJamSessionAPI({
                    jamSessionId: activeSessionId,
                    jamSessionCode: activeSessionCode,
                });
            }

            await clearActiveSession();
            close(() => setActiveSheet('none'));
            router.navigate('/jam' as any);
        } catch {
            Alert.alert('Error', isHost ? 'Could not end this Jam.' : 'Could not leave this Jam.');
        } finally {
            setFinishSubmitting(false);
        }
    };

    const openSheet = (sheet: BottomSheet) => { setActiveSheet(sheet); open(); };
    const closeSheet = () => close(() => setActiveSheet('none'));
    const toggleInvite = (id: string) => {
        setInvitedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Progress logic
    const progressPercent = player.duration > 0 ? (player.currentTime / player.duration) : 0;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(Math.floor(s % 60)).toString().padStart(2, '0')}`;
    const roomLabel = activeSessionCode || (activeSessionId ? `Room #${activeSessionId}` : 'Jam Room');

    if (!isHydrated || !activeSessionKey) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.loadingState}>
                    <ActivityIndicator color={Colors.teal} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <View style={styles.headerIcon}><Ionicons name="people" size={20} color={Colors.teal} /></View>
                <View>
                    <Text style={styles.headerTitle}>Live Jam Session</Text>
                    <Text style={styles.headerSub}>
                        {isHost ? 'Hosting' : 'Joined'} {roomLabel} • Max {activeSession?.size ?? Number(maxPeople)}
                    </Text>
                </View>
            </View>

            {/* ─── MEMBER AVATARS + ACTION ICONS ─── */}
            <View style={styles.actionRow}>
                <View style={styles.avatarsGroup}>
                    {avatarColors.map((color, i) => (
                        <View key={i} style={[styles.memberAvatar, { backgroundColor: color, marginLeft: i > 0 ? -10 : 0 }]} />
                    ))}
                </View>
                <View style={styles.iconsGroup}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('invite')}><Ionicons name="person-add-outline" size={20} color={Colors.teal} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('notification')}><Ionicons name="notifications-outline" size={20} color={Colors.teal} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('settings')}><Ionicons name="settings-outline" size={20} color={Colors.teal} /></TouchableOpacity>
                </View>
            </View>

            {/* ─── ALBUM ART ─── */}
            <View style={styles.albumSection}>
                <View style={[styles.albumArt, { borderColor: player.playing ? Colors.teal : '#2A2A2A', borderWidth: 2 }]}>
                    {currentTrack?.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={{ width: '100%', height: '100%', borderRadius: ALBUM_SIZE / 2 }} />
                    ) : (
                        <Ionicons name="musical-notes" size={64} color="#555" />
                    )}
                </View>
            </View>

            {/* ─── SONG INFO ─── */}
            <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{currentTrack?.title || "No track playing"}</Text>
                <Text style={styles.artistName}>{currentTrack?.contributors?.[0]?.name || "VibeSync"}</Text>
            </View>

            {/* ─── QUEUE ICON ─── */}
            <TouchableOpacity style={styles.queueRow}><Ionicons name="list" size={22} color={Colors.white} /></TouchableOpacity>

            {/* ─── PROGRESS ─── */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
                    <View style={[styles.progressThumb, { left: `${progressPercent * 100}%` }]} />
                </View>
                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(player.currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
                </View>
            </View>

            {/* ─── CONTROLS ─── */}
            <View style={styles.controls}>
                <TouchableOpacity><Ionicons name="shuffle" size={26} color={Colors.gray} /></TouchableOpacity>
                <TouchableOpacity onPress={() => sendControl('PREVIOUS')}><Ionicons name="play-skip-back" size={30} color={Colors.white} /></TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={handleTogglePlay}>
                    <Ionicons name={player.playing ? 'pause' : 'play'} size={32} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sendControl('SKIP')}><Ionicons name="play-skip-forward" size={30} color={Colors.white} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="repeat" size={26} color={Colors.gray} /></TouchableOpacity>
            </View>

            {/* ─── BOTTOM SHEETS ─── */}
            {activeSheet !== 'none' && (
                <>
                    <TouchableWithoutFeedback onPress={closeSheet}><Animated.View style={[styles.overlay, { opacity: overlayAnim }]} /></TouchableWithoutFeedback>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]}>
                        <View style={styles.sheetHeader} {...panResponder.panHandlers}><View style={styles.dragHandle} /></View>
                        
                        {activeSheet === 'invite' && (
                            <>
                                <Text style={styles.sheetTitle}>Invite members to your Jam</Text>
                                <TouchableOpacity style={styles.codeBtn}><Text style={styles.codeBtnText}>Code: {roomLabel}</Text></TouchableOpacity>
                                {!isHost ? (
                                    <Text style={styles.helperText}>Only the host can send invitations.</Text>
                                ) : (
                                    <>
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search members to invite..."
                                            placeholderTextColor={Colors.gray}
                                            value={inviteQuery}
                                            onChangeText={setInviteQuery}
                                        />
                                        {inviteLoading ? (
                                            <View style={styles.inlineLoader}>
                                                <ActivityIndicator color={Colors.teal} />
                                            </View>
                                        ) : (
                                            <FlatList
                                                data={inviteResults}
                                                keyExtractor={item => item.id.toString()}
                                                ListEmptyComponent={
                                                    <Text style={styles.helperText}>
                                                        {inviteQuery.trim() ? 'No members found.' : 'Search for members to invite.'}
                                                    </Text>
                                                }
                                                renderItem={({ item }) => {
                                                    const selected = invitedIds.has(item.id.toString());

                                                    return (
                                                        <View style={styles.memberRow}>
                                                            {item.avatarUrl ? (
                                                                <Image source={{ uri: item.avatarUrl }} style={styles.memberSearchAvatar} />
                                                            ) : (
                                                                <View style={styles.memberSearchAvatarPlaceholder}>
                                                                    <Ionicons name="person" size={18} color={Colors.gray} />
                                                                </View>
                                                            )}
                                                            <View style={styles.memberMeta}>
                                                                <Text style={styles.friendName}>{item.name}</Text>
                                                                <Text style={styles.memberMetaText}>
                                                                    {item.friendStatus === 'ACCEPTED' ? 'Friend' : 'Member'}
                                                                </Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                style={[styles.inviteBtn, selected && styles.invitedBtn]}
                                                                onPress={() => toggleInvite(item.id.toString())}
                                                            >
                                                                <Ionicons
                                                                    name={selected ? 'checkmark' : 'person-add-outline'}
                                                                    size={14}
                                                                    color={selected ? Colors.white : Colors.teal}
                                                                />
                                                                <Text style={[styles.inviteBtnText, selected && styles.invitedBtnText]}>
                                                                    {selected ? 'Selected' : 'Invite'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    );
                                                }}
                                            />
                                        )}
                                        <TouchableOpacity
                                            style={[styles.primarySheetBtn, (!invitedIds.size || inviteSubmitting) && styles.disabledSheetBtn]}
                                            onPress={handleSendInvites}
                                            disabled={!invitedIds.size || inviteSubmitting}
                                        >
                                            {inviteSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primarySheetBtnText}>Send Invites</Text>}
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}

                        {activeSheet === 'notification' && (
                            <>
                                <Text style={styles.sheetTitle}>Jam Activity</Text>
                                <FlatList data={activityItems} keyExtractor={item => item.id} renderItem={({ item }) => (
                                    <View style={styles.notifItem}>
                                        <View style={styles.notifAvatar} />
                                        <View style={styles.notifText}>
                                            <Text style={styles.notifBody}><Text style={styles.notifUser}>{item.user} </Text><Text style={styles.notifAction}>{item.action} </Text>{item.target ? <Text style={styles.notifTarget}>{item.target}</Text> : null}</Text>
                                            <Text style={styles.notifTime}>{item.time}</Text>
                                        </View>
                                        {item.hasCheck && <Ionicons name="checkmark-circle" size={20} color={Colors.teal} />}
                                    </View>
                                )} />
                            </>
                        )}

                        {activeSheet === 'settings' && (
                            <>
                                <Text style={styles.sheetTitle}>Jam Settings</Text>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingLeft}><View style={styles.settingIconBox}><Ionicons name="lock-closed" size={16} color={Colors.gray} /></View><View><Text style={styles.settingLabel}>Privacy Mode</Text><Text style={styles.settingDesc}>{isHost ? 'Friend Only' : 'Host controls this setting'}</Text></View></View>
                                    <Switch value={privacyMode} onValueChange={setPrivacyMode} trackColor={{ false: '#333', true: Colors.teal }} thumbColor={Colors.white} disabled={!isHost || settingsSubmitting} />
                                </View>
                                <View style={styles.sectionDivider} />
                                <TouchableOpacity style={styles.settingRow} onPress={() => isHost && setShowPeoplePicker(!showPeoplePicker)} disabled={!isHost || settingsSubmitting}>
                                    <Text style={styles.settingLabel}>Maximum number of people</Text>
                                    <View style={styles.settingRight}><Text style={[styles.settingLabel, { color: Colors.teal }]}>{maxPeople}</Text><Ionicons name={showPeoplePicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.gray} /></View>
                                </TouchableOpacity>
                                {showPeoplePicker && isHost && (
                                    <View style={styles.pickerDropdown}>
                                        {peopleCounts.map(count => (
                                            <TouchableOpacity key={count} style={[styles.pickerOption, maxPeople === count && styles.pickerOptionActive]} onPress={() => { setMaxPeople(count); setShowPeoplePicker(false); }}>
                                                <Text style={[styles.settingLabel, maxPeople === count && { color: Colors.teal }]}>{count}</Text>{maxPeople === count && <Ionicons name="checkmark" size={16} color={Colors.teal} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                {isHost && (
                                    <>
                                        <View style={styles.sectionDivider} />
                                        <TouchableOpacity style={[styles.primarySheetBtn, settingsSubmitting && styles.disabledSheetBtn]} onPress={handleSaveSettings} disabled={settingsSubmitting || !activeSessionId}>
                                            {settingsSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primarySheetBtnText}>Save Changes</Text>}
                                        </TouchableOpacity>
                                    </>
                                )}
                                <View style={styles.sectionDivider} />
                                <TouchableOpacity style={[styles.finishBtn, finishSubmitting && styles.disabledSheetBtn]} onPress={handleFinishJam} disabled={finishSubmitting}>
                                    {finishSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.finishText}>{isHost ? 'End Jam' : 'Leave Jam'}</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, paddingBottom: 32 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 12 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0F2D24', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.teal },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
    headerSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 4, marginBottom: 4 },
    avatarsGroup: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#000' },
    iconsGroup: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
    albumSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    albumArt: { width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center' },
    songInfo: { alignItems: 'center', marginBottom: 6, paddingHorizontal: 20 },
    songTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, marginBottom: 4 },
    artistName: { fontSize: 14, color: Colors.gray },
    queueRow: { alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 10 },
    progressContainer: { paddingHorizontal: 24, gap: 8, marginBottom: 18 },
    progressTrack: { height: 3, backgroundColor: '#333', borderRadius: 2, position: 'relative', justifyContent: 'center' },
    progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
    progressThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.white, top: -4.5, marginLeft: -6 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    timeText: { fontSize: 12, color: Colors.gray },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
    playBtn: { width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', elevation: 8 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT, backgroundColor: '#111', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 16 },
    sheetHeader: { width: '100%', alignItems: 'center', paddingBottom: 8 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', marginTop: 12, marginBottom: 6 },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 16 },
    codeBtn: { backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 18 },
    codeBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
    helperText: { color: Colors.gray, textAlign: 'center', lineHeight: 20, paddingVertical: 12 },
    searchInput: { height: 48, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 14, color: Colors.white, marginBottom: 14 },
    inlineLoader: { paddingVertical: 20 },
    friendsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    friendsTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    memberSearchAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A' },
    memberSearchAvatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
    memberMeta: { flex: 1 },
    memberMetaText: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    friendCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2A2A2A', margin: 4 },
    friendAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', borderWidth: 2, borderColor: Colors.teal },
    friendName: { fontSize: 13, fontWeight: '600', color: Colors.white },
    inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.teal },
    invitedBtn: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    inviteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.teal },
    invitedBtnText: { color: Colors.white },
    primarySheetBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    disabledSheetBtn: { opacity: 0.6 },
    primarySheetBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
    notifSeparator: { height: 1, backgroundColor: '#1A1A1A', marginLeft: 58 },
    notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    notifAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A', flexShrink: 0 },
    notifText: { flex: 1 },
    notifBody: { lineHeight: 19 },
    notifUser: { fontSize: 13, fontWeight: '700', color: Colors.white },
    notifAction: { fontSize: 13, color: Colors.gray },
    notifTarget: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
    notifTime: { fontSize: 11, color: Colors.gray, marginTop: 4 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    settingIconBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
    settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },
    settingDesc: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    sectionDivider: { height: 1, backgroundColor: '#1E1E1E' },
    pickerDropdown: { backgroundColor: '#1A1A1A', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 8 },
    pickerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    pickerOptionActive: { backgroundColor: '#0F2D24' },
    finishBtn: { height: 50, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A', marginTop: 12 },
    finishText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
