import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    PanResponder,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ALBUM_SIZE = width * 0.62;
const SHEET_HEIGHT = height * 0.55;

const friends = [
    { id: '1', name: 'Iam HDA' },
    { id: '2', name: 'OneKill' },
    { id: '3', name: 'MinhThu' },
    { id: '4', name: 'Alex99' },
];

const avatarColors = ['#555', '#6D28D9', '#4C1D95'];

const jamNotifications = [
    { id: '1', user: 'Iam HDA', action: 'jumped to 1:12 of the track', target: '"Em của ngày hôm qua"', hasCheck: true, time: '2m ago' },
    { id: '2', user: 'Iam HDA', action: 'joined the Jam with an invite code', target: '', hasCheck: false, time: '5m ago' },
    { id: '3', user: 'One Kill', action: 'was invited to the Jam by', target: 'Iam HDA', hasCheck: false, time: '8m ago' },
    { id: '4', user: 'Bien', action: 'add', target: '"Con mưa ngang" qua to playlist', hasCheck: false, time: '12m ago' },
];

const peopleCounts = ['02', '04', '06', '08', '10'];

type BottomSheet = 'none' | 'invite' | 'notification' | 'settings';

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
                    // dismiss
                    Animated.parallel([
                        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 200, useNativeDriver: true }),
                        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                    ]).start(onClose);
                } else {
                    // snap back
                    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
                }
            },
        })
    ).current;

    return { slideAnim, overlayAnim, dragY, panResponder, open, close };
}

export default function JamRoomScreen() {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [activeSheet, setActiveSheet] = useState<BottomSheet>('none');
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [privacyMode, setPrivacyMode] = useState(false);
    const [maxPeople, setMaxPeople] = useState('04');
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);

    const { slideAnim, overlayAnim, dragY, panResponder, open, close } = useBottomSheet(() => setActiveSheet('none'));

    const totalSeconds = 216;
    const currentSeconds = 78;
    const progressPercent = currentSeconds / totalSeconds;
    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const openSheet = (sheet: BottomSheet) => {
        setActiveSheet(sheet);
        open();
    };

    const closeSheet = () => close(() => setActiveSheet('none'));

    const toggleInvite = (id: string) => {
        setInvitedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Ionicons name="people" size={20} color={Colors.teal} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Live Jam Session</Text>
                    <Text style={styles.headerSub}>Synchronized with 4 others</Text>
                </View>
            </View>

            {/* ─── MEMBER AVATARS + ACTION ICONS (no border) ─── */}
            <View style={styles.actionRow}>
                <View style={styles.avatarsGroup}>
                    {avatarColors.map((color, i) => (
                        <View
                            key={i}
                            style={[styles.memberAvatar, { backgroundColor: color, marginLeft: i > 0 ? -10 : 0 }]}
                        />
                    ))}
                </View>
                <View style={styles.iconsGroup}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('invite')}>
                        <Ionicons name="person-add-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('notification')}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openSheet('settings')}>
                        <Ionicons name="settings-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── ALBUM ART (pushed down with flex spacer) ─── */}
            <View style={styles.albumSection}>
                <View style={styles.albumArt}>
                    <Ionicons name="musical-notes" size={64} color="#555" />
                </View>
            </View>

            {/* ─── SONG INFO ─── */}
            <View style={styles.songInfo}>
                <Text style={styles.songTitle}>Em của ngày hôm qua</Text>
                <Text style={styles.artistName}>Sơn Tùng MTP</Text>
            </View>

            {/* ─── QUEUE ICON ─── */}
            <TouchableOpacity style={styles.queueRow}>
                <Ionicons name="list" size={22} color={Colors.white} />
            </TouchableOpacity>

            {/* ─── PROGRESS ─── */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
                    <View style={[styles.progressThumb, { left: `${progressPercent * 100}%` }]} />
                </View>
                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(currentSeconds)}</Text>
                    <Text style={styles.timeText}>{formatTime(totalSeconds)}</Text>
                </View>
            </View>

            {/* ─── CONTROLS ─── */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                    <Ionicons name="shuffle" size={26} color={isShuffle ? Colors.teal : Colors.gray} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="play-skip-back" size={30} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="play-skip-forward" size={30} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
                    <Ionicons name="repeat" size={26} color={isRepeat ? Colors.teal : Colors.gray} />
                </TouchableOpacity>
            </View>

            {/* ════════════════════════════════
                BOTTOM SHEETS
            ════════════════════════════════ */}
            {activeSheet !== 'none' && (
                <>
                    {/* Overlay */}
                    <TouchableWithoutFeedback onPress={closeSheet}>
                        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                    </TouchableWithoutFeedback>

                    {/* Sheet — kéo toàn bộ header để dismiss */}
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]}>
                        <View style={styles.sheetHeader} {...panResponder.panHandlers}>
                            <View style={styles.dragHandle} />
                        </View>

                        {/* ── INVITE SHEET ── */}
                        {activeSheet === 'invite' && (
                            <>
                                <Text style={styles.sheetTitle}>Invite friends to join your Jam</Text>
                                <TouchableOpacity style={styles.codeBtn}>
                                    <Text style={styles.codeBtnText}>Code: ILOVEYOU</Text>
                                </TouchableOpacity>
                                <View style={styles.friendsHeader}>
                                    <Text style={styles.friendsTitle}>Invite friends</Text>
                                    <Ionicons name="search" size={20} color={Colors.gray} />
                                </View>
                                <FlatList
                                    data={friends}
                                    keyExtractor={item => item.id}
                                    numColumns={2}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 12 }}
                                    columnWrapperStyle={{ gap: 12 }}
                                    renderItem={({ item }) => (
                                        <View style={styles.friendCard}>
                                            <View style={styles.friendAvatar} />
                                            <Text style={styles.friendName}>{item.name}</Text>
                                            <TouchableOpacity
                                                style={[styles.inviteBtn, invitedIds.has(item.id) && styles.invitedBtn]}
                                                onPress={() => toggleInvite(item.id)}>
                                                <Ionicons
                                                    name={invitedIds.has(item.id) ? 'checkmark' : 'person-add-outline'}
                                                    size={14}
                                                    color={invitedIds.has(item.id) ? Colors.white : Colors.teal}
                                                />
                                                <Text style={[styles.inviteBtnText, invitedIds.has(item.id) && { color: Colors.white }]}>
                                                    {invitedIds.has(item.id) ? 'Invited' : 'Invite'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </>
                        )}

                        {/* ── NOTIFICATION SHEET ── */}
                        {activeSheet === 'notification' && (
                            <>
                                <Text style={styles.sheetTitle}>Jam Activity</Text>
                                <FlatList
                                    data={jamNotifications}
                                    keyExtractor={item => item.id}
                                    showsVerticalScrollIndicator={false}
                                    ItemSeparatorComponent={() => <View style={styles.notifSeparator} />}
                                    renderItem={({ item }) => (
                                        <View style={styles.notifItem}>
                                            <View style={styles.notifAvatar} />
                                            <View style={styles.notifText}>
                                                <Text style={styles.notifBody}>
                                                    <Text style={styles.notifUser}>{item.user} </Text>
                                                    <Text style={styles.notifAction}>{item.action} </Text>
                                                    {item.target ? <Text style={styles.notifTarget}>{item.target}</Text> : null}
                                                </Text>
                                                <Text style={styles.notifTime}>{item.time}</Text>
                                            </View>
                                            {item.hasCheck && (
                                                <Ionicons name="checkmark-circle" size={20} color={Colors.teal} />
                                            )}
                                        </View>
                                    )}
                                />
                            </>
                        )}

                        {/* ── SETTINGS SHEET ── */}
                        {activeSheet === 'settings' && (
                            <>
                                <Text style={styles.sheetTitle}>Jam Settings</Text>

                                {/* Privacy Mode */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingLeft}>
                                        <View style={styles.settingIconBox}>
                                            <Ionicons name="lock-closed" size={16} color={Colors.gray} />
                                        </View>
                                        <View>
                                            <Text style={styles.settingLabel}>Privacy Mode</Text>
                                            <Text style={styles.settingDesc}>Friend Only</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={privacyMode}
                                        onValueChange={setPrivacyMode}
                                        trackColor={{ false: '#333', true: Colors.teal }}
                                        thumbColor={Colors.white}
                                    />
                                </View>

                                <View style={styles.sectionDivider} />

                                {/* Max people */}
                                <TouchableOpacity
                                    style={styles.settingRow}
                                    onPress={() => setShowPeoplePicker(!showPeoplePicker)}>
                                    <Text style={styles.settingLabel}>Maximum number of people</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.settingLabel, { color: Colors.teal }]}>{maxPeople}</Text>
                                        <Ionicons name={showPeoplePicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.gray} />
                                    </View>
                                </TouchableOpacity>

                                {showPeoplePicker && (
                                    <View style={styles.pickerDropdown}>
                                        {peopleCounts.map(count => (
                                            <TouchableOpacity
                                                key={count}
                                                style={[styles.pickerOption, maxPeople === count && styles.pickerOptionActive]}
                                                onPress={() => { setMaxPeople(count); setShowPeoplePicker(false); }}>
                                                <Text style={[styles.settingLabel, maxPeople === count && { color: Colors.teal }]}>{count}</Text>
                                                {maxPeople === count && <Ionicons name="checkmark" size={16} color={Colors.teal} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.sectionDivider} />

                                {/* Finish Jam */}
                                <TouchableOpacity
                                    style={styles.finishBtn}
                                    onPress={() => { closeSheet(); router.push('/(tabs)/jam' as any); }}>
                                    <Text style={styles.finishText}>Finish Jam</Text>
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
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 32,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
        gap: 12,
    },
    headerIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#0F2D24',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.teal,
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
    headerSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },

    // Action row — NO border
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 4,
        marginBottom: 4,
    },
    avatarsGroup: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#000' },
    iconsGroup: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },

    // Album art — flex:1 lấp đầy vùng trống, justifyContent:center căn giữa
    albumSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    albumArt: {
        width: ALBUM_SIZE, height: ALBUM_SIZE,
        borderRadius: ALBUM_SIZE / 2,
        backgroundColor: '#1E1E1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
    },

    // Song info
    songInfo: { alignItems: 'center', marginBottom: 6, paddingHorizontal: 20 },
    songTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, marginBottom: 4 },
    artistName: { fontSize: 14, color: Colors.gray },

    // Queue
    queueRow: { alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 10 },

    // Progress
    progressContainer: { paddingHorizontal: 24, gap: 8, marginBottom: 18 },
    progressTrack: {
        height: 3, backgroundColor: '#333', borderRadius: 2,
        position: 'relative', justifyContent: 'center',
    },
    progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
    progressThumb: {
        position: 'absolute', width: 12, height: 12, borderRadius: 6,
        backgroundColor: Colors.white, top: -4.5, marginLeft: -6,
    },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    timeText: { fontSize: 12, color: Colors.gray },

    // Controls
    controls: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 24,
        marginBottom: 20,
    },
    playBtn: {
        width: 62, height: 62, borderRadius: 31,
        backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
        elevation: 8,
    },

    // Overlay + Sheet
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: SHEET_HEIGHT,
        backgroundColor: '#111',
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    sheetHeader: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 8,
    },
    dragHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: '#333',
        marginTop: 12, marginBottom: 6,
    },
    sheetTitle: {
        fontSize: 16, fontWeight: '800', color: Colors.white,
        textAlign: 'center', marginBottom: 16,
    },

    // Invite
    codeBtn: {
        backgroundColor: Colors.teal, borderRadius: 12,
        paddingVertical: 12, alignItems: 'center', marginBottom: 18,
    },
    codeBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
    friendsHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    friendsTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
    friendCard: {
        flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14,
        padding: 12, alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#2A2A2A',
    },
    friendAvatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#333', borderWidth: 2, borderColor: Colors.teal,
    },
    friendName: { fontSize: 13, fontWeight: '600', color: Colors.white },
    inviteBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1.5, borderColor: Colors.teal,
    },
    invitedBtn: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    inviteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.teal },

    // Notification
    notifSeparator: { height: 1, backgroundColor: '#1A1A1A', marginLeft: 58 },
    notifItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, gap: 12,
    },
    notifAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2A2A', flexShrink: 0 },
    notifText: { flex: 1 },
    notifBody: { lineHeight: 19 },
    notifUser: { fontSize: 13, fontWeight: '700', color: Colors.white },
    notifAction: { fontSize: 13, color: Colors.gray },
    notifTarget: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
    notifTime: { fontSize: 11, color: Colors.gray, marginTop: 4 },

    // Settings
    settingRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 12,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIconBox: {
        width: 34, height: 34, borderRadius: 8,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },
    settingDesc: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    sectionDivider: { height: 1, backgroundColor: '#1E1E1E' },
    pickerDropdown: {
        backgroundColor: '#1A1A1A', borderRadius: 10, overflow: 'hidden',
        borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 8,
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    pickerOptionActive: { backgroundColor: '#0F2D24' },
    finishBtn: {
        height: 50, borderRadius: 12,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
        marginTop: 12,
    },
    finishText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
