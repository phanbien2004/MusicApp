import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Toast from 'react-native-root-toast';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { useJam } from '@/context/jam-context';

import { createStompClient } from '@/api/apiSocket';
import { deleteJamSessionAPI, inviteJamSessionAPI, leaveJamSessionAPI, updateJamSessionAPI } from '@/services/jamService';
import { searchAPI } from '@/services/searchService';

import { acceptNotification, acceptNotificationRequestDTO } from '@/services/jamService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JamInviteSheet from './jamInviteSheet';
import JamNotificationSheet from './jamNotificationSheet';
import JamSettingsSheet from './jamSettingSheet';

const { width, height } = Dimensions.get('window');
const ALBUM_SIZE = width * 0.62;
const SHEET_HEIGHT = height * 0.55;

export default function JamRoomScreen() {
    const router = useRouter();
    const { jamId, seekPosition, isPlaying: isPlayingParam, t } = useLocalSearchParams<{
        jamId?: string;
        seekPosition?: string;
        isPlaying?: string;
        t?:string
    }>();
    const { accessToken } = useAuth();
    const { activeSession, clearActiveSession, isHydrated, setActiveSession } = useJam();
    const { currentTrack, player, setCurrentTrack } = useCurrentTrack()!;
    const status = useAudioPlayerStatus(player);
    const isHost = Boolean(activeSession?.isHost);


    const [activeSheet, setActiveSheet] = useState<'none' | 'invite' | 'notification' | 'settings'>('none');
    const [activityItems, setActivityItems] = useState<any[]>([]);
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [privacyMode, setPrivacyMode] = useState(false);
    const [maxPeople, setMaxPeople] = useState('04');
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);
    
    const [inviteQuery, setInviteQuery] = useState('');
    const [inviteResults, setInviteResults] = useState<any[]>([]);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    const stompClientRef       = useRef<any>(null);
    const playerRef            = useRef(player);
    const isHostRef            = useRef(isHost);     
    const currentTrackRef      = useRef(currentTrack);
    const memberIdRef          = useRef<number | null>(null);
    const progressWidthRef     = useRef(1);
    const initialSyncDoneRef   = useRef(false);   
    const syncTimeoutRef       = useRef<ReturnType<typeof setTimeout> | null>(null); 
    const isHandoverDone = useRef(false); // Chốt chặn

    useEffect(() => {
        if (!inviteQuery.trim()) {
            setInviteResults([]);
        }
    }, [inviteQuery]);

    useEffect(() => {
        console.log("[JamRoom] Resetting sync guard for new session/re-join");
        initialSyncDoneRef.current = false; 
    }, [jamId, t]);

    useEffect(() => {
        if (!seekPosition) return;
        if (initialSyncDoneRef.current) return;       
        if (status.duration <= 0) return;           
        
        initialSyncDoneRef.current = true;

        const pos = parseFloat(seekPosition);
        const shouldPlay = isPlayingParam === 'true';
        console.log('[JamRoom] Player ready (d:', status.duration, ') → sync in 200ms | pos:', pos, '| play:', shouldPlay);
        
        syncTimeoutRef.current = setTimeout(async () => {
            try {
                await playerRef.current.seekTo(pos);
                if (shouldPlay) {
                    playerRef.current.play();
                } else {
                    playerRef.current.pause();
                }
                console.log('[JamRoom] Initial sync done ✔ pos:', pos, '| playing:', shouldPlay);
            } catch (e) {
                console.error('[JamRoom] Initial sync error:', e);
            }
        }, 400);
    }, [status.duration, jamId, t]);

    useEffect(() => {
        return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
    }, []);


    const handleSearchInvites = async (query: string) => {
        if (!query.trim()) return;
        setInviteLoading(true);
        try {
            const data = await searchAPI({
                keyword: query,
                type: 'members',
                pageNumber: 1,
                pageSize: 20
            });
            if (data.memberPreviewDTOS?.content) {
                setInviteResults(data.memberPreviewDTOS.content);
            } else {
                setInviteResults([]);
            }
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
        } finally {
            setInviteLoading(false);
        }
    };

   useEffect(() => {
        if (!isHost || !activeSession?.sessionId) return;
        console.log("📡 [SYNC] Bắt đầu tự động gửi trạng thái mỗi 2s");

        const intervalId = setInterval(() => {
            const client = stompClientRef.current;
            if (client && client.connected) {
                const currentTime = playerRef.current?.currentTime || 0;
                const isPlaying = playerRef.current?.playing || false;

                const payload = {
                    jamId: activeSession.sessionId,
                    currentSeekPosition: Math.floor(currentTime),
                    isPlaying: isPlaying,
                };
                client.publish({
                    destination: '/app/jam/player-state',
                    body: JSON.stringify(payload)
                });
            }
        }, 1000);

    return () => {
        console.log("🛑 [SYNC] Dừng tự động gửi trạng thái");
        clearInterval(intervalId);
    };
}, [isHost, activeSession?.sessionId]);

    const handleSendInvites = async () => {
        const res = await inviteJamSessionAPI(Number(activeSession?.sessionId), Array.from(invitedIds).map(id => parseInt(id, 10)));
        Toast.show(res.message || 'Invites sent!', {
            position: Toast.positions.CENTER,
            backgroundColor: Colors.teal,
        });
        setInvitedIds(new Set());
    }


    useEffect(() => { playerRef.current = player; }, [player]);
    useEffect(() => { isHostRef.current = isHost; }, [isHost]);

    const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const dragY = useRef(new Animated.Value(0)).current;

    // const formatMessageWithTime = (originalMessage: any) => {
    //     if (!originalMessage || typeof originalMessage !== 'string') {
    //         return "";
    //     }
    //     const match = originalMessage.match(/\d+/);
        
    //     if (match) {
    //         const seconds = parseInt(match[0], 10);
    //         const mins = Math.floor(seconds / 60);
    //         const secs = seconds % 60;
    //         const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    //         return originalMessage.replace(match[0], timeFormatted);
    //     }
    //     return originalMessage;
    // };

    const handlePushNotification = async(data : any) => {
        const userId = await AsyncStorage.getItem('userId');
        if(data.senderId != userId && data.message !== null) {
            Toast.show(data.message, {
                duration: Toast.durations.LONG,
                position: 150,
                backgroundColor: Colors.teal,
                textColor: '#FFFFFF',
            });
            setActivityItems(prev => [data, ...prev])
        }
    }

    const handlePlaybackSync = async (data : any, isTrack: boolean) => {
        if(isTrack === false) {
            try {
                if(data.status === null || data.status === "ACCEPTED") {
                    if(data.interactionType === "PAUSE") {
                        playerRef.current.pause();
                    }else if(data.interactionType === "PLAY") {
                        playerRef.current.play();
                    }else if(data.interactionType === "JUMP") {
                        playerRef.current.seekTo(data.duration);
                    }
                }
            } catch (e) {
                console.error("Lỗi khi điều khiển Player:", e);
            }
        }else {
            if(data.title === null) {
                if(data.currentSeekPosition) {
                    playerRef.current.seekTo(data.currentSeekPosition)
                }
                if(data.playing){
                    playerRef.current.play()
                }else{
                    playerRef.current.pause()
                }
            }else{
                setCurrentTrack({
                    id: data.id,
                    title: data.title || '',
                    thumbnailUrl: data.thumbnailUrl || '',
                    duration: data.duration || 0,
                    contributors: data.contributors || [],
                    trackUrl: data.trackUrl || ''
                }, true);
            }
        }
    }

    useEffect(() => {
        if (!activeSession?.sessionId) return;
        setActivityItems([]);
        const client = createStompClient();
        client.onConnect = () => {
            console.log("Connected to Jam:", activeSession.sessionId);
            client.subscribe(`/jam/notification/${activeSession.sessionId}`, (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    console.log("Receipt Messenger", data);
                    handlePushNotification(data);
                    handlePlaybackSync(data, false)
                } catch (error) {
                    console.error("❌ Lỗi Parse JSON:", error);
                }
            });
            client.subscribe(`/jam/track/${activeSession.sessionId}`, (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    console.log("Receipt Messenger Track", data);
                    handlePlaybackSync(data, true);
                }catch (error) {
                    console.error("❌ Lỗi Parse JSON:", error);
                }
            })
        };
        client.activate();
        stompClientRef.current = client;
        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, [activeSession?.sessionId]);

    const openSheet = (sheet: typeof activeSheet) => {
        setActiveSheet(sheet);
        dragY.setValue(0);
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const closeSheet = () => {
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: SHEET_HEIGHT, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setActiveSheet('none'));
    };

    const handleFinishJam = async () => {
        try {
            setSubmitting(true);
            if (isHost) await deleteJamSessionAPI(Number(activeSession?.sessionId));
            else await leaveJamSessionAPI({ jamSessionId: Number(activeSession?.sessionId) });
            clearActiveSession();
            closeSheet();
            router.replace('/(tabs)/jam');
        } catch (e) {
            Toast.show('Failed to leave Jam');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!activeSession?.sessionId) return;
        setSubmitting(true);
        try {
            await updateJamSessionAPI({
                jamSessionId: activeSession.sessionId,
                size: parseInt(maxPeople, 10),
                isPublic: !privacyMode
            });
            Toast.show('Settings updated successfully', {
                position: Toast.positions.CENTER,
                backgroundColor: Colors.teal
            });
            closeSheet();
        } catch (error) {
            console.error("Lỗi khi update jam:", error);
            Toast.show('Failed to update settings', {
                position: Toast.positions.CENTER,
                backgroundColor: '#FF5555'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handlePlayPause = () => {
        const isPlaying = status.playing;
        if (isHost) {
            if (stompClientRef.current?.connected && activeSession?.sessionId) {
                const dest = `/app/jam/notification`;
                const payload = {
                    jamId: activeSession.sessionId,
                    trackId: currentTrack?.id,
                    notificationType: "JAM_INTERACTION",
                    interactionType: isPlaying ? "PAUSE" : "PLAY",
                };
                stompClientRef.current.publish({ destination: dest, body: JSON.stringify(payload) });
            }
        }
        if(!isHost) {
            if (stompClientRef.current?.connected && activeSession?.sessionId) {
                stompClientRef.current.publish({
                    destination: '/app/jam/notification',
                    body: JSON.stringify({
                        jamId: activeSession.sessionId,
                        trackId: currentTrack?.id,
                        notificationType: "JAM_INTERACTION",
                        interactionType: isPlaying? "PAUSE" : "PLAY",
                    })
                })
            Alert.alert("Request sent. Awaiting host approval");
            }
        }
    };

    const handleJump = (seconds: number) => {
        if (stompClientRef.current?.connected && activeSession) {
            const payload = {
                jamId: activeSession.sessionId,
                trackId: currentTrack?.id,
                notificationType: "JAM_INTERACTION",
                interactionType: "JUMP", 
                duration: Math.floor(seconds),
            };
            stompClientRef.current.publish({
                destination: '/app/jam/notification',
                body: JSON.stringify(payload)
            });
            if(!isHost){
                Alert.alert("Request sent. Awaiting host approval");
            }
        }
    };

    const handleApproveRequest = async (notification : any) => {
        console.log("handleApproveRequest");
        if (activeSession && currentTrack) {
            const request : acceptNotificationRequestDTO= {
                jamId: activeSession.sessionId,
                jamNotificationId: notification.jamNotificationId || notification.id,
                trackId: notification.trackId ? notification.trackId : currentTrackRef.current?.id,
                interactionType: notification.interactionType ? notification.interactionType : currentTrackRef.current?.id,
                seekPosition: notification.duration ? notification.duration : Math.round(player.currentTime)
            };
            console.log("REQUEST APPROVEREQUESt FROM JAMROOM: ", request);
            const res = await acceptNotification(request);
            console.log("RESPONSE APPROVERESPONSE FROM JAMROOM", res.config.data);
            
            setActivityItems(prev => prev.map(item => 
                (item === notification || item.jamNotificationId === notification.jamNotificationId || (item.id && item.id === notification.id))
                ? { ...item, status: 'ACCEPTED' } 
                : item
            ));
        }
    };
 
    const duration = status.duration > 0 ? status.duration : 1;
    const displayPosition = isSeeking ? seekValue : status.currentTime;
    const formatTime = (s: number) => {
        if (!s || isNaN(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (!isHydrated || !activeSession?.sessionId) {
        return <View style={styles.loader}><ActivityIndicator color={Colors.teal} size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerIcon}><Ionicons name="people" size={24} color={Colors.teal} /></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Live Jam Session</Text>
                    <Text style={styles.headerSub}>
                        {privacyMode ? 'Private' : 'Public'} • Max {parseInt(maxPeople, 10)} members
                    </Text>
                </View>
            </View>

            {/* AVATARS & TOP CONTROLS */}
            <View style={styles.topControlsRow}>
                <View style={styles.avatarsContainer}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#FFFFFF', zIndex: 3 }]} />
                    <View style={[styles.avatarCircle, { backgroundColor: '#FDF6D5', zIndex: 2, marginLeft: -12 }]} />
                    <View style={[styles.avatarCircle, { backgroundColor: '#47225A', zIndex: 1, marginLeft: -12 }]} />
                </View>
                <View style={styles.topIcons}>
                    <TouchableOpacity onPress={() => openSheet('invite')} style={styles.smallIconBtn}>
                         <Ionicons name="person-add-outline" size={24} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openSheet('notification')} style={styles.smallIconBtn}>
                         <Ionicons name="notifications-outline" size={24} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openSheet('settings')} style={styles.smallIconBtn}>
                         <Ionicons name="settings-outline" size={24} color={Colors.teal} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* MAIN PLAYER UI */}
            <View style={styles.albumSection}>
                <View style={styles.albumArt}>
                    {currentTrack?.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.fullImg} />
                    ) : (
                        <Ionicons name="musical-notes" size={64} color="#333" />
                    )}
                </View>
            </View>

            <View style={styles.songInfoContainer}>
                 <View style={styles.songInfoText}>
                     <Text style={styles.songTitle} numberOfLines={1}>{currentTrack?.title || "No track playing"}</Text>
                     <Text style={styles.artistName}>{currentTrack?.contributors?.[0]?.name || "VibeSync"}</Text>
                 </View>
                 <TouchableOpacity style={styles.playlistIcon}>
                     <Ionicons name="options-outline" size={24} color="#FFF" />
                 </TouchableOpacity>
            </View>

            {/* PROGRESS */}
            <View style={styles.sliderContainer}>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={displayPosition}
                    minimumTrackTintColor={Colors.teal}
                    maximumTrackTintColor="#333"
                    thumbTintColor={Colors.white}
                    onSlidingStart={() => setIsSeeking(true)}
                    onValueChange={(v) => setSeekValue(v)}
                    onSlidingComplete={(v) => { 
                        setIsSeeking(false); 
                        handleJump(v)
                    }}
                />
                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>

            {/* PLAYBACK CONTROLS */}
            <View style={styles.playbackControls}>
                <TouchableOpacity><Ionicons name="shuffle" size={24} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="play-skip-back" size={32} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                    <Ionicons name={status.playing ? 'pause' : 'play'} size={32} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity><Ionicons name="play-skip-forward" size={32} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="repeat" size={24} color="#FFF" /></TouchableOpacity>
            </View>

            {/* BOTTOM SHEETS */}
            {activeSheet !== 'none' && (
                <>
                    <TouchableWithoutFeedback onPress={closeSheet}>
                        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                    </TouchableWithoutFeedback>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]}>
                        <View style={styles.sheetHeader}><View style={styles.dragHandle} /></View>
                        
                        {activeSheet === 'invite' && (
                            <JamInviteSheet 
                                jamId={activeSession.sessionId.toString()}
                                sessionCode={activeSession.sessionCode}
                                isHost={isHost}
                                query={inviteQuery}
                                setQuery={setInviteQuery}
                                loading={inviteLoading}
                                results={inviteResults}
                                invitedIds={invitedIds}
                                setInvitedIds={setInvitedIds}
                                onSendInvites={handleSendInvites} 
                                onSearch={handleSearchInvites}
                            />
                        )}

                        {activeSheet === 'notification' && (
                            <JamNotificationSheet 
                                isHost={isHost}
                                activityItems={activityItems}
                                onApprove={handleApproveRequest}
                            />
                        )}

                        {activeSheet === 'settings' && (
                            <JamSettingsSheet 
                                isHost={isHost}
                                privacyMode={privacyMode}
                                setPrivacyMode={setPrivacyMode}
                                maxPeople={maxPeople}
                                showPeoplePicker={showPeoplePicker}
                                onShowPicker={() => setShowPeoplePicker(!showPeoplePicker)}
                                onSelectPeople={(c: string) => { setMaxPeople(c); setShowPeoplePicker(false); }}
                                onSave={handleSaveSettings}
                                onFinish={handleFinishJam}
                                submitting={submitting}
                                peopleCounts={['02', '04', '06', '08', '10']}
                            />
                        )}
                    </Animated.View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#090909' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090909' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, gap: 12 },
    headerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0F2D24', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 2 },
    headerSub: { fontSize: 12, color: '#A0A0A0', fontWeight: '600' },
    topControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
    avatarsContainer: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#090909' },
    topIcons: { flexDirection: 'row', gap: 15 },
    smallIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    albumSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    albumArt: { width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2, backgroundColor: '#F0F0F0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: Colors.teal },
    fullImg: { width: '100%', height: '100%' },
    songInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, marginBottom: 25 },
    songInfoText: { flex: 1, alignItems: 'center' },
    songTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    artistName: { fontSize: 14, color: '#A0A0A0' },
    playlistIcon: { position: 'absolute', right: 30, top: '25%' },
    sliderContainer: { marginBottom: 30 },
    slider: { width: width - 40, alignSelf: 'center', height: 40 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, marginTop: -5 },
    timeText: { fontSize: 11, color: '#777', fontWeight: 'bold' },
    playbackControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 25, marginBottom: 40 },
    playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, elevation: 10 },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT, backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 20, zIndex: 101, elevation: 11 },
    sheetHeader: { width: '100%', alignItems: 'center', paddingVertical: 15 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333' }
});