import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { usePlayer } from '@/context/player-context';
import { addTrackToPlayListAPI, createPlayListAPI, getMemberPlayListAPI, getPlayListDetailAPI } from '@/services/listService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Keyboard,
    Modal,
    SectionList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 80;
const QUEUE_HEIGHT = height * 0.85;

// Helper format thời gian
const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function CurrentTrackScreen() {
    const context = useCurrentTrack();
    if (!context || !context.currentTrack || !context.player) {
        return (
            <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.gray }}>Không có bài hát nào đang phát.</Text>
            </View>
        );
    }
    return <CurrentTrackUI currentTrack={context.currentTrack} player={context.player} />;
}

function CurrentTrackUI({ currentTrack, player }: { currentTrack: any, player: any }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const status = useAudioPlayerStatus(player);
    const { lastActiveTab } = usePlayer();

    // Navigate back to whichever tab was active before opening the player
    const handleClose = () => {
        const tab = lastActiveTab || 'home';
        router.replace(`/(tabs)/${tab}` as any);
    };

    // --- STATES ---
    const [showAddToListModal, setShowAddToListModal] = useState(false);
    const [myPlaylists, setMyPlaylists] = useState<any[]>([]);
    const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);

    // --- STATES: CREATE NEW PLAYLIST INLINE ---
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);

    const [showQueue, setShowQueue] = useState(false);
    const slideAnim = useRef(new Animated.Value(QUEUE_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    // --- LOGIC: CHECK IF TRACK EXISTS IN PLAYLIST ---
    const isTrackAlreadyInList = (playlist: any) => {
        return Array.isArray(playlist.tracks) &&
            playlist.tracks.some((t: any) => t.id === currentTrack.id);
    };

    const openAddToList = async () => {
        setShowAddToListModal(true);
        setIsFetchingPlaylists(true);
        setMyPlaylists([]);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;

            // Step 1: fetch basic playlist list (id, title, thumbnailUrl only)
            const basicList = await getMemberPlayListAPI(userId);
            if (!basicList || basicList.length === 0) {
                setMyPlaylists([]);
                return;
            }

            // Step 2: fetch details in parallel to get tracks[]
            const detailResults = await Promise.allSettled(
                basicList.map((pl) => getPlayListDetailAPI(pl.id))
            );

            // Merge: fallback to basic data with empty tracks[] if detail fetch fails
            const merged = basicList.map((pl, index) => {
                const result = detailResults[index];
                if (result.status === 'fulfilled' && result.value) {
                    return result.value;
                }
                return { ...pl, tracks: [] };
            });

            setMyPlaylists(merged);
        } catch (error) {
            console.error('Failed to load playlists:', error);
        } finally {
            setIsFetchingPlaylists(false);
        }
    };

    const handleAddToPlaylist = async (playlist: any) => {
        if (isTrackAlreadyInList(playlist)) return;

        try {
            await addTrackToPlayListAPI([playlist.id], currentTrack.id);
            // Update local state immediately so UI moves item to "Saved" section
            setMyPlaylists(prev =>
                prev.map(pl =>
                    pl.id === playlist.id
                        ? { ...pl, tracks: [...(pl.tracks || []), { id: currentTrack.id }] }
                        : pl
                )
            );
        } catch (error) {
            Alert.alert('Error', 'Could not add track to playlist.');
        }
    };

    // --- LOGIC: CREATE NEW PLAYLIST AND SAVE TRACK IMMEDIATELY ---
    const handleCreateNewPlaylist = async () => {
        const trimmed = newPlaylistName.trim();
        if (!trimmed) return;
        setIsCreating(true);
        Keyboard.dismiss();
        try {
            // Step 1: Create new playlist
            const res = await createPlayListAPI(trimmed);
            console.log('[DEBUG] createPlayListAPI response:', JSON.stringify(res), 'type:', typeof res);

            // Extract ID flexibly — handle primitive (number/string) or object response
            let playlistId: number | null = null;
            if (typeof res === 'number') {
                playlistId = res;
            } else if (typeof res === 'string' && !isNaN(Number(res))) {
                playlistId = Number(res);
            } else if (res && typeof res === 'object') {
                playlistId = res.id ?? res.playlistId ?? res.playlist_id
                    ?? res.data?.id ?? res.data?.playlistId ?? null;
            }

            if (!playlistId) {
                throw new Error(`Could not extract playlist ID. Response: ${JSON.stringify(res)}`);
            }

            // Step 2: Add current track to the new playlist
            await addTrackToPlayListAPI([playlistId], currentTrack.id);

            // Step 3: Update local state — new playlist appears immediately in "Saved" section
            const newEntry = {
                id: playlistId,
                title: trimmed,
                thumbnailUrl: (res as any)?.thumbnailUrl || null,
                tracks: [{ id: currentTrack.id }],
            };
            setMyPlaylists(prev => [newEntry, ...prev]);

            setNewPlaylistName('');
            setShowCreateForm(false);
        } catch (error: any) {
            console.error('Create playlist error:', error);
            Alert.alert('Error', error?.message || 'Could not create playlist. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    // --- PLAYER CONTROLS ---
    const handlePlayPause = () => {
        if (status.playing) player.pause();
        else player.play();
    };

    const displayPosition = isSeeking ? seekValue : status.currentTime;
    const duration = status.duration > 0 ? status.duration : 1;
 

    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.circleBtn} onPress={handleClose}>
                    <Ionicons name="chevron-down" size={28} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
                <TouchableOpacity style={styles.circleBtn}><Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} /></TouchableOpacity>
            </View>

            {/* ARTWORK */}
            <View style={styles.artworkSection}>
                <View style={styles.artworkContainer}>
                    {currentTrack.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholderArt}><Ionicons name="musical-notes" size={100} color="#333" /></View>
                    )}
                </View>
            </View>

            {/* INFO & CONTROLS */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.songInfoContainer}>
                    <View style={styles.songTitleRow}>
                        <Text style={styles.songTitle} numberOfLines={1}>{currentTrack.title}</Text>
                        <TouchableOpacity onPress={openAddToList}>
                            <Ionicons name="add-circle-outline" size={32} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.artistName}>{currentTrack.contributors?.at(0)?.name || 'Artist'}</Text>
                </View>

                {/* SLIDER */}
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
                        onSlidingComplete={(v) => { player.seekTo(v); setIsSeeking(false); }}
                    />
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}><Ionicons name="shuffle" size={26} color={isShuffle ? Colors.teal : Colors.gray} /></TouchableOpacity>
                    <TouchableOpacity><Ionicons name="play-skip-back" size={36} color={Colors.white} /></TouchableOpacity>
                    <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                        <Ionicons name={status.playing ? 'pause' : 'play'} size={40} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity><Ionicons name="play-skip-forward" size={36} color={Colors.white} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}><Ionicons name="repeat" size={26} color={isRepeat ? Colors.teal : Colors.gray} /></TouchableOpacity>
                </View>
            </View>

            {/* ─── MODAL: ADD TO PLAYLIST (2 SECTIONS) ─── */}
            <Modal visible={showAddToListModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddToListModal(false)} />
                    <View style={[styles.addToListSheet, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.modalTitle}>Add to Playlist</Text>

                        {isFetchingPlaylists ? (
                            <ActivityIndicator color={Colors.teal} style={{ marginVertical: 30 }} />
                        ) : myPlaylists.length === 0 ? (
                            <Text style={styles.emptyListText}>You have no playlists yet.</Text>
                        ) : (
                            <SectionList
                                sections={[
                                    {
                                        title: 'Saved',
                                        data: myPlaylists.filter((pl: any) => isTrackAlreadyInList(pl)),
                                    },
                                    {
                                        title: 'Available',
                                        data: myPlaylists.filter((pl: any) => !isTrackAlreadyInList(pl)),
                                    },
                                ].filter(section => section.data.length > 0)}
                                keyExtractor={(item: any) => item.id.toString()}
                                renderSectionHeader={({ section }) => (
                                    <View style={styles.sectionHeaderContainer}>
                                        <View style={[
                                            styles.sectionBadge,
                                            section.title === 'Saved'
                                                ? styles.sectionBadgeSaved
                                                : styles.sectionBadgeAvailable
                                        ]}>
                                            <Ionicons
                                                name={section.title === 'Saved' ? 'checkmark-done' : 'add'}
                                                size={12}
                                                color={section.title === 'Saved' ? Colors.teal : Colors.white}
                                            />
                                            <Text style={[
                                                styles.sectionHeaderText,
                                                { color: section.title === 'Saved' ? Colors.teal : Colors.white }
                                            ]}>
                                                {section.title}
                                            </Text>
                                        </View>
                                        <View style={styles.sectionLine} />
                                    </View>
                                )}
                                renderItem={({ item, section }: { item: any; section: any }) => {
                                    const isSaved = section.title === 'Saved';
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.playlistItem,
                                                isSaved ? styles.playlistItemSaved : styles.playlistItemAvailable,
                                            ]}
                                            onPress={() => !isSaved && handleAddToPlaylist(item)}
                                            activeOpacity={isSaved ? 1 : 0.75}
                                        >
                                            <View style={[
                                                styles.playlistThumbMini,
                                                isSaved && { borderWidth: 1.5, borderColor: Colors.teal + '55' }
                                            ]}>
                                                {item.thumbnailUrl ? (
                                                    <Image source={{ uri: item.thumbnailUrl }} style={styles.fullImg} />
                                                ) : (
                                                    <Ionicons name="musical-notes" size={20} color={isSaved ? Colors.teal + '88' : '#555'} />
                                                )}
                                                {isSaved && (
                                                    <View style={styles.savedOverlay}>
                                                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                                                    </View>
                                                )}
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.playlistTitleText,
                                                    isSaved && { color: Colors.gray },
                                                ]}>
                                                    {item.title}
                                                </Text>
                                                {isSaved ? (
                                                    <Text style={styles.savedLabel}>Already in this playlist</Text>
                                                ) : (
                                                    <Text style={styles.trackCount}>
                                                        {item.tracks?.length ?? 0} {item.tracks?.length === 1 ? 'track' : 'tracks'}
                                                    </Text>
                                                )}
                                            </View>

                                            <View style={[
                                                styles.actionBtn,
                                                isSaved ? styles.actionBtnSaved : styles.actionBtnAdd
                                            ]}>
                                                <Ionicons
                                                    name={isSaved ? 'checkmark-circle' : 'add-circle'}
                                                    size={22}
                                                    color={isSaved ? Colors.teal : Colors.white}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
                                stickySectionHeadersEnabled={false}
                            />
                        )}

                        {/* ── INLINE CREATE FORM ── */}
                        {showCreateForm ? (
                            <View style={styles.createFormContainer}>
                                <View style={styles.createFormHeader}>
                                    <Ionicons name="musical-notes" size={16} color={Colors.teal} />
                                    <Text style={styles.createFormTitle}>New Playlist</Text>
                                </View>
                                <View style={styles.createFormTrackHint}>
                                    <Text style={styles.createFormHintText} numberOfLines={1}>
                                        📌 Will save: <Text style={{ color: Colors.white, fontWeight: '700' }}>{currentTrack.title}</Text>
                                    </Text>
                                </View>
                                <View style={styles.createInputRow}>
                                    <TextInput
                                        style={styles.createInput}
                                        placeholder="Playlist name..."
                                        placeholderTextColor="#555"
                                        value={newPlaylistName}
                                        onChangeText={setNewPlaylistName}
                                        autoFocus
                                        maxLength={50}
                                        returnKeyType="done"
                                        onSubmitEditing={handleCreateNewPlaylist}
                                    />
                                </View>
                                <View style={styles.createFormActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => { setShowCreateForm(false); setNewPlaylistName(''); }}
                                        disabled={isCreating}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.confirmBtn, (!newPlaylistName.trim() || isCreating) && { opacity: 0.5 }]}
                                        onPress={handleCreateNewPlaylist}
                                        disabled={!newPlaylistName.trim() || isCreating}
                                    >
                                        {isCreating ? (
                                            <ActivityIndicator size="small" color={Colors.white} />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark" size={16} color={Colors.white} />
                                                <Text style={styles.confirmBtnText}>Create & Save</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.createNewBtn}
                                onPress={() => setShowCreateForm(true)}
                            >
                                <Ionicons name="add" size={18} color={Colors.white} style={{ marginRight: 6 }} />
                                <Text style={styles.createNewText}>New Playlist</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
    circleBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    nowPlayingText: { color: Colors.white, fontWeight: 'bold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
    artworkSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    artworkContainer: { width: ARTWORK_SIZE, height: ARTWORK_SIZE, borderRadius: 24, backgroundColor: '#222', overflow: 'hidden', elevation: 20 },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderArt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bottomSection: { paddingHorizontal: 30 },
    songInfoContainer: { marginBottom: 15 },
    songTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    songTitle: { color: Colors.white, fontSize: 26, fontWeight: 'bold', flex: 1, marginRight: 10 },
    artistName: { color: Colors.teal, fontSize: 16, marginTop: 4 },
    sliderContainer: { marginBottom: 20 },
    slider: { width: width - 40, alignSelf: 'center', height: 40 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -5 },
    timeText: { color: '#888', fontSize: 12 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    addToListSheet: { backgroundColor: '#181818', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: height * 0.6 },
    modalTitle: { color: Colors.white, fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 15 },
    dragHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    playlistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#222', gap: 15, paddingHorizontal: 20 },
    playlistThumbMini: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    playlistTitleText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
    fullImg: { width: '100%', height: '100%' },
    emptyListText: { color: Colors.gray, textAlign: 'center', marginTop: 40, fontSize: 14 },
    createNewBtn: { backgroundColor: Colors.teal, margin: 20, paddingVertical: 14, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    createNewText: { color: Colors.white, fontWeight: '800', fontSize: 15 },

    // ── Section header ──
    sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 6 },
    sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 10 },
    sectionBadgeSaved: { backgroundColor: Colors.teal + '22', borderWidth: 1, borderColor: Colors.teal + '55' },
    sectionBadgeAvailable: { backgroundColor: '#FFFFFF18', borderWidth: 1, borderColor: '#FFFFFF30' },
    sectionHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    sectionLine: { flex: 1, height: 0.5, backgroundColor: '#333' },

    // ── Playlist item variants ──
    playlistItemSaved: { backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 6 },
    playlistItemAvailable: { backgroundColor: '#242424', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.teal + '33' },

    // ── Thumbnail overlay ──
    savedOverlay: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: Colors.teal, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // ── Sub-labels ──
    savedLabel: { color: Colors.teal, fontSize: 11, fontWeight: '700', marginTop: 2, opacity: 0.8 },
    trackCount: { color: '#666', fontSize: 12, marginTop: 2 },

    // ── Action button ──
    actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    actionBtnSaved: { backgroundColor: Colors.teal + '20' },
    actionBtnAdd: { backgroundColor: Colors.teal + '33' },

    // ── Inline Create Form ──
    createFormContainer: {
        margin: 16,
        backgroundColor: '#1e1e1e',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.teal + '44',
    },
    createFormHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    createFormTitle: {
        color: Colors.teal,
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    createFormTrackHint: {
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 12,
    },
    createFormHintText: {
        color: Colors.gray,
        fontSize: 12,
    },
    createInputRow: {
        marginBottom: 12,
    },
    createInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: Colors.white,
        fontSize: 15,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: Colors.teal + '55',
    },
    createFormActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#2d2d2d',
        borderWidth: 1,
        borderColor: '#444',
    },
    cancelBtnText: {
        color: Colors.gray,
        fontWeight: '700',
        fontSize: 14,
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.teal,
        flexDirection: 'row',
        gap: 6,
    },
    confirmBtnText: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: 14,
    },
});