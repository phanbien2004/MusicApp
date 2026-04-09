import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { type CurrentTrack, useCurrentTrack } from '@/context/currentTrack-context';
import { useJam } from '@/context/jam-context';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayerStatus } from 'expo-audio';
import * as Clipboard from 'expo-clipboard';
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
import Toast from 'react-native-root-toast';

const { width, height } = Dimensions.get('window');
const ALBUM_SIZE = width * 0.62;
const SHEET_HEIGHT = height * 0.55;

// --- HELPERS (Logic của Biên) ---
const avatarColors = ['#555', '#6D28D9', '#4C1D95'];
const peopleCounts = ['02', '04', '06', '08', '10'];

type BottomSheet = 'none' | 'invite' | 'notification' | 'settings';



const parseStoredMemberId = (value: string | null) => {
    if (!value) return null;
    try {
        const parsedValue = JSON.parse(value);
        return typeof parsedValue === 'number' ? parsedValue : Number(parsedValue);
    } catch { return Number(value) || null; }
};

const normalizeSeekTime = (value: unknown) => {
    const normalizedValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(normalizedValue) && normalizedValue >= 0 ? normalizedValue : null;
};

const normalizeJamTrack = (value: unknown): CurrentTrack | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const normalizedId = Number(source.id);
    const trackUrl = typeof source.trackUrl === 'string' ? source.trackUrl.trim() : '';
    if (!normalizedId || !trackUrl) return null;

    return {
        id: normalizedId,
        title: String(source.title || ''),
        thumbnailUrl: String(source.thumbnailUrl || ''),
        duration: Number(source.duration) || 0,
        contributors: Array.isArray(source.contributors) ? source.contributors : [],
        trackUrl,
    };
};

const waitForTrackSync = (delayMs = 250) => new Promise((resolve) => setTimeout(resolve, delayMs));

// --- COMPONENT ICON SÓNG NHẠC ĐỘNG ---
const PlayingAnimation = () => {
    const anim1 = useRef(new Animated.Value(6)).current;
    const anim2 = useRef(new Animated.Value(12)).current;
    const anim3 = useRef(new Animated.Value(8)).current;

    useEffect(() => {
        const createAnim = (val: Animated.Value, to: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: to, duration: 400, useNativeDriver: false }),
                    Animated.timing(val, { toValue: 6, duration: 400, useNativeDriver: false }),
                ])
            );
        Animated.parallel([createAnim(anim1, 16), createAnim(anim2, 10), createAnim(anim3, 18)]).start();
    }, []);

    return (
        <View style={styles.eqContainer}>
            <Animated.View style={[styles.eqBar, { height: anim1 }]} />
            <Animated.View style={[styles.eqBar, { height: anim2 }]} />
            <Animated.View style={[styles.eqBar, { height: anim3 }]} />
        </View>
    );
};

// --- CUSTOM HOOK CHO BOTTOM SHEET ---
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
            onPanResponderMove: (_, gs) => { if (gs.dy > 0) dragY.setValue(gs.dy); },
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
    const status = useAudioPlayerStatus(player);
    const isHost = Boolean(activeSession?.isHost);
    
    // UI States
    const [activeSheet, setActiveSheet] = useState<BottomSheet>('none');
    const [activityItems, setActivityItems] = useState<any[]>([]);
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

    // Refs
    const stompClientRef = useRef<any>(null);
    const playerRef = useRef(player);
    const currentTrackRef = useRef(currentTrack);
    const memberIdRef = useRef<number | null>(null);

    const { slideAnim, overlayAnim, dragY, panResponder, open, close } = useBottomSheet(() => setActiveSheet('none'));
    const activeSessionKey = activeSession?.sessionId;
    const activeSessionCode = activeSession?.sessionCode;

    const copyToClipboard = async () => {
        if (activeSessionCode) {
            await Clipboard.setStringAsync(activeSessionCode.toString());
                Toast.show('Code copied to clipboard!', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.CENTER,
                backgroundColor: Colors.teal,
            });
        }
    };

    // --- PLAYER PERSISTENCE ---
    const persistPlayerState = useCallback(async (seekTimeOverride?: number) => {
        const memberId = memberIdRef.current;
        const trackId = currentTrackRef.current?.id;
        if (!activeSessionKey || !memberId || !trackId) return;

        try {
            await savePlayerStateAPI({
                currentSeekPosition: Math.max(0, Math.floor(seekTimeOverride ?? playerRef.current.currentTime ?? 0)),
                trackId, memberId, playlistId: 0, albumId: 0,
            });
        } catch (error) { console.log('Persist failed:', error); }
    }, [activeSessionKey]);

    useEffect(() => { playerRef.current = player; }, [player]);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

    useEffect(() => {
        const hydrateMember = async () => {
            const stored = await AsyncStorage.getItem('userId');
            memberIdRef.current = parseStoredMemberId(stored);
        };
        hydrateMember();
    }, []);

    useEffect(() => {
        if (activeSession) {
            setPrivacyMode(Boolean(activeSession.isPrivate));
            setMaxPeople(String(activeSession.size ?? 4).padStart(2, '0'));
        }
    }, [activeSession]);

    // --- KẾT NỐI WEBSOCKET (LOGIC CỦA BACKEND BIÊN) ---
    useEffect(() => {
        if (!accessToken || !activeSessionKey) return;

        const client = createStompClient(accessToken);
        
        client.onConnect = () => {
            console.log("JamRoom: WebSocket Connected to", activeSessionKey);
            
            // Subscribe kênh thông báo từ Java: /jam/notification{id}
            client.subscribe(`/jam/notification${activeSessionKey}`, (message) => {
                const data = JSON.parse(message.body);

                // 1. Toast notify
                Toast.show(data.message, { duration: Toast.durations.SHORT, position: Toast.positions.TOP, backgroundColor: Colors.teal });

                // 2. Activity list update
                setActivityItems(prev => [{
                    id: String(data.id || Date.now()),
                    user: "", action: data.message, target: "",
                    hasCheck: data.type === 'JAM_INTERACTION',
                    time: 'just now',
                }, ...prev].slice(0, 30));

                // 3. Playback Sync
                if (data.type === 'JAM_INTERACTION') {
                    const syncedTrack = normalizeJamTrack(data.track);
                    const syncedSeekTime = normalizeSeekTime(data.seekTime);

                    const syncAction = async () => {
                        if (syncedTrack && currentTrackRef.current?.id !== syncedTrack.id) {
                            setCurrentTrack(syncedTrack);
                            currentTrackRef.current = syncedTrack;
                            await waitForTrackSync();
                        }
                        if (syncedSeekTime !== null) {
                            try { await playerRef.current.seekTo(syncedSeekTime); } catch (e) {}
                        }
                        if (data.message.toLowerCase().includes("play")) playerRef.current.play();
                        else if (data.message.toLowerCase().includes("pause")) playerRef.current.pause();
                    };
                    void syncAction();
                }
            });
        };

        client.activate();
        stompClientRef.current = client;
        return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
    }, [accessToken, activeSessionKey, setCurrentTrack]);

    // --- SEARCH LOGIC (Dành cho Invite Sheet) ---
    useEffect(() => {
        if (activeSheet !== 'invite' || !inviteQuery.trim()) {
            setInviteResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setInviteLoading(true);
                const res = await searchAPI({ keyword: inviteQuery.trim(), type: 'members', pageNumber: 1, pageSize: 12 });
                setInviteResults(res.memberPreviewDTOS?.content ?? []);
            } catch (e) { console.log(e); }
            finally { setInviteLoading(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [activeSheet, inviteQuery]);

    // --- CONTROLS ---
    const sendControl = (type: 'PLAY' | 'PAUSE' | 'SKIP' | 'PREVIOUS') => {
        const seek = player.currentTime;
        void persistPlayerState(seek);

        if (stompClientRef.current?.connected && activeSessionKey) {
            stompClientRef.current.publish({
                destination: `/app/jam.control/${activeSessionKey}`,
                body: JSON.stringify({
                    interactionType: type,
                    trackId: currentTrack?.id,
                    jamJd: activeSession?.sessionId,
                    duration: Math.floor(seek),
                    notificationType: 'JAM_INTERACTION'
                })
            });
        }
    };

    const handleTogglePlay = () => {
        if (status.playing) { player.pause(); sendControl('PAUSE'); }
        else { player.play(); sendControl('PLAY'); }
    };

    const handleSaveSettings = async () => {
        if (!isHost || !activeSessionKey || settingsSubmitting) return;
        try {
            setSettingsSubmitting(true);
            await updateJamSessionAPI(Number(activeSessionKey), Number(maxPeople), !privacyMode);
            await setActiveSession({ ...activeSession!, size: Number(maxPeople), isPrivate: privacyMode });
            Alert.alert('Success', 'Jam settings updated.');
        } catch { Alert.alert('Error', 'Update failed.'); }
        finally { setSettingsSubmitting(false); }
    };

    const handleSendInvites = async () => {
        if (!isHost || !activeSessionKey || inviteSubmitting) return;
        const ids = [...invitedIds].map(Number);
        if (!ids.length) return Alert.alert('Error', 'Select a member.');
        try {
            setInviteSubmitting(true);
            await inviteFriendsAPI(Number(activeSessionKey), ids);
            Alert.alert('Sent', 'Invitations sent.');
            setInvitedIds(new Set());
        } catch { Alert.alert('Error', 'Invite failed.'); }
        finally { setInviteSubmitting(false); }
    };

    const handleFinishJam = async () => {
        if (finishSubmitting) return;
        try {
            setFinishSubmitting(true);
            if (isHost) await deleteJamSessionAPI(Number(activeSessionKey));
            else await leaveJamSessionAPI({ jamSessionId: Number(activeSessionKey) });
            await clearActiveSession();
            close(() => setActiveSheet('none'));
            router.navigate('/jam' as any);
        } catch { Alert.alert('Error', 'Action failed.'); }
        finally { setFinishSubmitting(false); }
    };

    const openSheet = (sheet: BottomSheet) => { setActiveSheet(sheet); open(); };
    const closeSheet = () => close(() => setActiveSheet('none'));
    
    if (!isHydrated || !activeSessionKey) return (
        <SafeAreaView style={styles.safeArea}><ActivityIndicator color={Colors.teal} size="large" style={{flex:1}}/></SafeAreaView>
    );

    const progressPercent = player.duration > 0 ? (player.currentTime / player.duration) : 0;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(Math.floor(s % 60)).toString().padStart(2, '0')}`;
    const roomLabel = activeSession?.sessionCode || `Room #${activeSessionKey}`;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerIcon}><Ionicons name="people" size={20} color={Colors.teal} /></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Live Jam Session</Text>
                    <Text style={styles.headerSub}>{isHost ? 'Hosting' : 'Joined'} {roomLabel} • Max {activeSession?.size || maxPeople}</Text>
                </View>
                {status.playing && <PlayingAnimation />}
            </View>

            {/* AVATARS & ACTION ICONS */}
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

            {/* ALBUM ART */}
            <View style={styles.albumSection}>
                <View style={[styles.albumArt, { borderColor: status.playing ? Colors.teal : '#2A2A2A', borderWidth: 2 }]}>
                    {currentTrack?.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={{ width: '100%', height: '100%', borderRadius: ALBUM_SIZE / 2 }} />
                    ) : (
                        <Ionicons name="musical-notes" size={64} color="#555" />
                    )}
                </View>
            </View>

            {/* SONG INFO */}
            <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{currentTrack?.title || "No track playing"}</Text>
                <Text style={styles.artistName}>{currentTrack?.contributors?.[0]?.name || "VibeSync"}</Text>
            </View>

            {/* PROGRESS */}
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

            {/* CONTROLS */}
            <View style={styles.controls}>
                <TouchableOpacity><Ionicons name="shuffle" size={26} color={Colors.gray} /></TouchableOpacity>
                <TouchableOpacity onPress={() => sendControl('PREVIOUS')}><Ionicons name="play-skip-back" size={30} color={Colors.white} /></TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={handleTogglePlay}>
                    <Ionicons name={status.playing ? 'pause' : 'play'} size={32} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sendControl('SKIP')}><Ionicons name="play-skip-forward" size={30} color={Colors.white} /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="repeat" size={26} color={Colors.gray} /></TouchableOpacity>
            </View>

            {/* BOTTOM SHEETS */}
            {activeSheet !== 'none' && (
                <>
                    <TouchableWithoutFeedback onPress={closeSheet}><Animated.View style={[styles.overlay, { opacity: overlayAnim }]} /></TouchableWithoutFeedback>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]}>
                        <View style={styles.sheetHeader} {...panResponder.panHandlers}><View style={styles.dragHandle} /></View>
                        
                       {activeSheet === 'invite' && (
                            <>
                                <Text style={styles.sheetTitle}>Invite members to your Jam</Text>
                                
                                {/* Ô hiển thị Code mới: Đẹp và gọn hơn */}
                                <TouchableOpacity 
                                    style={styles.codeContainer} 
                                    onPress={copyToClipboard}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.codeLabel}>JAM CODE (Tap to copy)</Text>
                                        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="middle">
                                            {activeSessionKey}
                                        </Text>
                                    </View>
                                    <Ionicons name="copy-outline" size={20} color={Colors.teal} />
                                </TouchableOpacity>

                                {!isHost ? (
                                    <Text style={styles.helperText}>Only the host can send invitations.</Text>
                                ) : (
                                    <>
                                        <View style={styles.searchWrapper}>
                                            <Ionicons name="search" size={18} color={Colors.gray} style={{marginLeft: 12}} />
                                            <TextInput 
                                                style={styles.inviteSearchInput} 
                                                placeholder="Search members..." 
                                                placeholderTextColor={Colors.gray} 
                                                value={inviteQuery} 
                                                onChangeText={setInviteQuery} 
                                            />
                                        </View>

                                        {inviteLoading ? (
                                            <ActivityIndicator color={Colors.teal} style={{ margin: 20 }} />
                                        ) : (
                                            <FlatList
                                                data={inviteResults}
                                                keyExtractor={item => item.id.toString()}
                                                renderItem={({ item }) => {
                                                    const sel = invitedIds.has(item.id.toString());
                                                    return (
                                                        <View style={styles.memberRow}>
                                                            <View style={styles.memberSearchAvatarPlaceholder}>
                                                                {item.avatarUrl ? (
                                                                    <Image source={{ uri: item.avatarUrl }} style={styles.fullImg} />
                                                                ) : (
                                                                    <Ionicons name="person" size={20} color="#666" />
                                                                )}
                                                            </View>
                                                            <View style={styles.memberMeta}>
                                                                <Text style={styles.friendName}>{item.name}</Text>
                                                                <Text style={styles.memberMetaText}>{item.friendStatus === 'ACCEPTED' ? 'Friend' : 'Member'}</Text>
                                                            </View>
                                                            <TouchableOpacity 
                                                                style={[styles.inviteBtn, sel && styles.invitedBtn]} 
                                                                onPress={() => {
                                                                    const next = new Set(invitedIds);
                                                                    sel ? next.delete(item.id.toString()) : next.add(item.id.toString());
                                                                    setInvitedIds(next);
                                                                }}
                                                            >
                                                                <Text style={[styles.inviteBtnText, sel && { color: '#FFF' }]}>
                                                                    {sel ? 'Selected' : 'Invite'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    );
                                                }}
                                                style={{ maxHeight: height * 0.25 }} // Giới hạn chiều cao list để không đè nút Send
                                            />
                                        )}
                                        <TouchableOpacity 
                                            style={[styles.primarySheetBtn, (!invitedIds.size || inviteSubmitting) && { opacity: 0.5 }]} 
                                            onPress={handleSendInvites} 
                                            disabled={!invitedIds.size || inviteSubmitting}
                                        >
                                            <Text style={styles.primarySheetBtnText}>Send Invites</Text>
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
                                            <Text style={styles.notifBody}>{item.action}</Text>
                                            <Text style={styles.notifTime}>{item.time}</Text>
                                        </View>
                                        {item.hasCheck && <Ionicons name="checkmark-circle" size={20} color={Colors.teal} />}
                                    </View>
                                )} ListEmptyComponent={<Text style={styles.helperText}>No activity yet.</Text>} />
                            </>
                        )}

                        {activeSheet === 'settings' && (
                            <View>
                                <Text style={styles.sheetTitle}>Jam Settings</Text>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingLeft}><Text style={styles.settingLabel}>Privacy Mode</Text></View>
                                    <Switch value={privacyMode} onValueChange={setPrivacyMode} disabled={!isHost} />
                                </View>
                                <TouchableOpacity style={styles.settingRow} onPress={() => isHost && setShowPeoplePicker(!showPeoplePicker)}>
                                    <Text style={styles.settingLabel}>Max People</Text>
                                    <Text style={{color:Colors.teal}}>{maxPeople}</Text>
                                </TouchableOpacity>
                                {showPeoplePicker && (
                                    <View style={styles.pickerDropdown}>
                                        {peopleCounts.map(c => (
                                            <TouchableOpacity key={c} style={styles.pickerOption} onPress={() => {setMaxPeople(c); setShowPeoplePicker(false)}}>
                                                <Text style={{color:'#FFF'}}>{c}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                {isHost && <TouchableOpacity style={styles.primarySheetBtn} onPress={handleSaveSettings}><Text style={styles.primarySheetBtnText}>Save Changes</Text></TouchableOpacity>}
                                <TouchableOpacity style={styles.finishBtn} onPress={handleFinishJam}><Text style={styles.finishText}>{isHost ? 'End Jam' : 'Leave Jam'}</Text></TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, paddingBottom: 32 },
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
    codeBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
    searchInput: { height: 48, borderRadius: 12, backgroundColor: '#1A1A1A', paddingHorizontal: 14, color: '#FFF', marginBottom: 14 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    memberSearchAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A' },
    memberMeta: { flex: 1 },
    friendName: { color: '#FFF', fontWeight: '600' },
    memberMetaText: { color: '#888', fontSize: 12 },
    inviteBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.teal },
    invitedBtn: { backgroundColor: Colors.teal },
    inviteBtnText: { color: Colors.teal, fontWeight: '700' },
    primarySheetBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    primarySheetBtnText: { color: '#FFF', fontWeight: '700' },
    notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    notifAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A' },
    notifText: { flex: 1 },
    notifBody: { color: '#FFF' },
    notifTime: { color: '#888', fontSize: 11 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
    settingLabel: { color: '#FFF', fontWeight: '600' },
    pickerDropdown: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10 },
    pickerOption: { padding: 10 },
    finishBtn: { height: 50, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    finishText: { color: '#FFF', fontWeight: '700' },
    eqContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 },
    eqBar: { width: 3, backgroundColor: Colors.teal, borderRadius: 1 },
    helperText: {
        color: Colors.gray,
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 14,
        lineHeight: 20,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    codeLabel: {
        fontSize: 10,
        color: Colors.teal,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 1,
    },
    codeValue: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Nhìn giống mã code hơn
    },
    // Thanh Search mới
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        marginBottom: 15,
    },
    inviteSearchInput: {
        flex: 1,
        height: 45,
        paddingHorizontal: 10,
        color: '#FFF',
        fontSize: 14,
    },
    memberSearchAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    fullImg: {
        width: '100%',
        height: '100%',
    }
});