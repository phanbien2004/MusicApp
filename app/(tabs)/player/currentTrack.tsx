import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    PanResponder,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 80;
const QUEUE_HEIGHT = height * 0.75;

interface QueueItem {
    id: string;
    title: string;
    artist: string;
    isCurrent: boolean;
}

const initialQueue: QueueItem[] = [
    { id: '1', title: 'Em Của Ngày Hôm Qua', artist: 'Sơn Tùng MTP', isCurrent: true },
    { id: '2', title: 'Nơi Này Có Anh', artist: 'Sơn Tùng MTP', isCurrent: false },
    { id: '3', title: 'Chạy Ngay Đi', artist: 'Sơn Tùng MTP', isCurrent: false },
    { id: '4', title: 'Lạc Trôi', artist: 'Sơn Tùng MTP', isCurrent: false },
    { id: '5', title: 'Muộn Rồi Mà Sao Còn', artist: 'Sơn Tùng MTP', isCurrent: false },
    { id: '6', title: 'Hãy Trao Cho Anh', artist: 'Sơn Tùng MTP', isCurrent: false },
];

export default function CurrentTrackScreen() {
    const router = useRouter();
    const { lastActiveTab } = usePlayer();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
    const [contextItem, setContextItem] = useState<QueueItem | null>(null);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const slideAnim = useRef(new Animated.Value(QUEUE_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    const totalSeconds = 216;
    const currentSeconds = 78;
    const progressPercent = currentSeconds / totalSeconds;
    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Vuốt xuống ≥ 60px trên header → đóng queue
    const swipeResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
            onPanResponderRelease: (_, g) => {
                if (g.dy > 60) closeQueue();
            },
        })
    ).current;

    const openQueue = () => {
        setShowQueue(true);
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const closeQueue = () => {
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: QUEUE_HEIGHT, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setShowQueue(false));
    };

    const openContextMenu = (item: QueueItem) => {
        setContextItem(item);
        setShowContextMenu(true);
    };

    const handleDelete = () => {
        if (!contextItem) return;
        setQueue((prev) => prev.filter((q) => q.id !== contextItem.id));
        setShowContextMenu(false);
    };

    const handleMoveToTop = () => {
        if (!contextItem) return;
        setQueue((prev) => {
            const rest = prev.filter((q) => q.id !== contextItem.id);
            // Đặt sau bài đang current
            const currentIndex = rest.findIndex((q) => q.isCurrent);
            const insertAt = currentIndex + 1;
            return [...rest.slice(0, insertAt), contextItem, ...rest.slice(insertAt)];
        });
        setShowContextMenu(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => router.push(`/(tabs)/${lastActiveTab}` as any)}>
                    <Ionicons name="chevron-down" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {/* ─── ALBUM ART ─── */}
            <View style={styles.artworkSection}>
                <View style={styles.artwork}>
                    <Ionicons name="musical-notes" size={80} color="#555" />
                </View>
            </View>

            {/* ─── BOTTOM SECTION ─── */}
            <View style={styles.bottomSection}>
                <View style={styles.songInfoContainer}>
                    <View style={styles.songTitleRow}>
                        <Text style={styles.songTitle} numberOfLines={1}>Em Của Ngày Hôm Qua</Text>
                        <TouchableOpacity>
                            <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.artistName}>Sơn Tùng MTP</Text>
                </View>

                <TouchableOpacity style={styles.listIconRow} onPress={openQueue}>
                    <Ionicons name="list" size={24} color={Colors.white} />
                </TouchableOpacity>

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

                <View style={styles.controls}>
                    <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                        <Ionicons name="shuffle" size={26} color={isShuffle ? Colors.teal : Colors.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="play-skip-back" size={30} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="play-skip-forward" size={30} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
                        <Ionicons name="repeat" size={26} color={isRepeat ? Colors.teal : Colors.gray} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── QUEUE BOTTOM SHEET ─── */}
            {showQueue && (
                <>
                    <TouchableWithoutFeedback onPress={closeQueue}>
                        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[styles.queueSheet, { transform: [{ translateY: slideAnim }] }]}>
                        {/* Drag handle + header: gắn swipe responder */}
                        <View {...swipeResponder.panHandlers}>
                            <View style={styles.dragHandle} />
                            <View style={styles.queueHeader}>
                                <Text style={styles.queueTitle}>Queue</Text>
                                <TouchableOpacity style={styles.editBtn}>
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <FlatList
                            data={queue}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.queueItem}>
                                    <View style={[styles.queueThumb, item.isCurrent && styles.queueThumbActive]}>
                                        <Ionicons name="musical-notes" size={16}
                                            color={item.isCurrent ? Colors.teal : '#555'} />
                                    </View>
                                    <View style={styles.queueInfo}>
                                        <Text style={[styles.queueItemTitle,
                                        item.isCurrent && { color: Colors.teal }]}
                                            numberOfLines={1}>
                                            {item.isCurrent && '♫  '}{item.title}
                                        </Text>
                                        <Text style={styles.queueItemArtist}>{item.artist}</Text>
                                    </View>
                                    {/* Icon ≡ — chỉ non-current mới có menu */}
                                    {!item.isCurrent ? (
                                        <TouchableOpacity
                                            style={styles.menuIconBtn}
                                            onPress={() => openContextMenu(item)}>
                                            <Ionicons name="reorder-three" size={22} color={Colors.gray} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.menuIconBtn} />
                                    )}
                                </View>
                            )}
                        />
                    </Animated.View>
                </>
            )}

            {/* ─── CONTEXT MENU MODAL ─── */}
            <Modal
                visible={showContextMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowContextMenu(false)}>
                <TouchableWithoutFeedback onPress={() => setShowContextMenu(false)}>
                    <View style={styles.contextOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.contextMenu}>
                                {/* Song info header */}
                                <View style={styles.contextHeader}>
                                    <View style={styles.contextThumb}>
                                        <Ionicons name="musical-notes" size={16} color={Colors.teal} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.contextSongTitle} numberOfLines={1}>
                                            {contextItem?.title}
                                        </Text>
                                        <Text style={styles.contextArtist}>{contextItem?.artist}</Text>
                                    </View>
                                </View>

                                <View style={styles.contextDivider} />

                                {/* Move to top */}
                                <TouchableOpacity style={styles.contextAction} onPress={handleMoveToTop}>
                                    <Ionicons name="arrow-up-circle-outline" size={22} color={Colors.white} />
                                    <Text style={styles.contextActionText}>Move to top</Text>
                                </TouchableOpacity>

                                {/* Delete */}
                                <TouchableOpacity style={styles.contextAction} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={22} color="#FF5555" />
                                    <Text style={[styles.contextActionText, { color: '#FF5555' }]}>
                                        Delete from queue
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.contextDivider} />

                                {/* Cancel */}
                                <TouchableOpacity
                                    style={[styles.contextAction, { justifyContent: 'center' }]}
                                    onPress={() => setShowContextMenu(false)}>
                                    <Text style={[styles.contextActionText, { color: Colors.gray }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1, backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    circleBtn: {
        width: 42, height: 42, borderRadius: 21,
        borderWidth: 1.5, borderColor: '#333',
        alignItems: 'center', justifyContent: 'center',
    },
    nowPlayingText: { fontSize: 13, fontWeight: '700', color: Colors.white, letterSpacing: 2 },
    artworkSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    artwork: {
        width: ARTWORK_SIZE, height: ARTWORK_SIZE, borderRadius: 20,
        backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center', elevation: 12,
    },
    bottomSection: { paddingHorizontal: 28, paddingBottom: 40, gap: 10 },
    songInfoContainer: { gap: 6 },
    songTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    songTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, flex: 1, marginRight: 12 },
    artistName: { fontSize: 16, color: Colors.teal, fontWeight: '600' },
    listIconRow: { alignItems: 'flex-end' },
    progressContainer: { gap: 8, marginTop: 12 },
    progressTrack: { height: 4, backgroundColor: '#333', borderRadius: 2, position: 'relative', justifyContent: 'center' },
    progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
    progressThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.white, top: -5, marginLeft: -7 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    timeText: { fontSize: 12, color: Colors.gray },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    playBtn: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', elevation: 8,
    },

    // Queue sheet
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    queueSheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: QUEUE_HEIGHT,
        backgroundColor: '#141414',
        borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 8,
    },
    dragHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: '#444',
        alignSelf: 'center', marginTop: 12, marginBottom: 4,
    },
    queueHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
    },
    queueTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#2A2A2A' },
    editText: { fontSize: 13, color: Colors.white, fontWeight: '600' },
    queueItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 14 },
    queueThumb: {
        width: 48, height: 48, borderRadius: 8, backgroundColor: '#222',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333',
    },
    queueThumbActive: { borderColor: Colors.teal, backgroundColor: '#1A2A24' },
    queueInfo: { flex: 1 },
    queueItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.white, marginBottom: 3 },
    queueItemArtist: { fontSize: 12, color: Colors.gray },
    menuIconBtn: { width: 32, alignItems: 'center' },

    // Context menu
    contextOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
    },
    contextMenu: {
        width: '100%', backgroundColor: '#1E1E1E',
        borderRadius: 18, overflow: 'hidden',
    },
    contextHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    contextThumb: {
        width: 44, height: 44, borderRadius: 8, backgroundColor: '#2A2A2A',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.teal,
    },
    contextSongTitle: { fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 2 },
    contextArtist: { fontSize: 12, color: Colors.gray },
    contextDivider: { height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 0 },
    contextAction: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 20, paddingVertical: 16,
    },
    contextActionText: { fontSize: 15, color: Colors.white, fontWeight: '500' },
});
