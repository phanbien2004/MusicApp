import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 80;
const QUEUE_HEIGHT = height * 0.85;

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
];

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

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);

    const [showQueue, setShowQueue] = useState(false);
    const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
    const [contextItem, setContextItem] = useState<QueueItem | null>(null);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const slideAnim = useRef(new Animated.Value(QUEUE_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    const handlePlayPause = () => {
        if (status.playing) player.pause();
        else player.play();
    };

    const handleSlidingStart = () => setIsSeeking(true);
    const handleValueChange = (value: number) => setSeekValue(value);
    const handleSlidingComplete = (value: number) => {
        player.seekTo(value);
        setIsSeeking(false);
    };

    const displayPosition = isSeeking ? seekValue : status.currentTime;
    const duration = status.duration > 0 ? status.duration : 1;

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
            const currentIndex = rest.findIndex((q) => q.isCurrent);
            const insertAt = currentIndex + 1;
            return [...rest.slice(0, insertAt), contextItem, ...rest.slice(insertAt)];
        });
        setShowContextMenu(false);
    };

    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-down" size={28} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.artworkSection}>
                <View style={styles.artworkContainer}>
                    {currentTrack.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholderArt}>
                            <Ionicons name="musical-notes" size={100} color="#333" />
                        </View>
                    )}
                </View>
            </View>

            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.songInfoContainer}>
                    <View style={styles.songTitleRow}>
                        <Text style={styles.songTitle} numberOfLines={1}>{currentTrack.title}</Text>
                        <TouchableOpacity>
                            <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.artistName}>{currentTrack.contributors?.at(0)?.name || 'Nghệ sĩ'}</Text>
                </View>

                <TouchableOpacity style={styles.listIconRow} onPress={openQueue}>
                    <Ionicons name="list" size={24} color={Colors.white} />
                </TouchableOpacity>

                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration}
                        value={displayPosition}
                        minimumTrackTintColor={Colors.teal}
                        maximumTrackTintColor="#333"
                        thumbTintColor={Colors.white}
                        onSlidingStart={handleSlidingStart}
                        onValueChange={handleValueChange}
                        onSlidingComplete={handleSlidingComplete}
                    />
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                        <Ionicons name="shuffle" size={26} color={isShuffle ? Colors.teal : Colors.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity><Ionicons name="play-skip-back" size={36} color={Colors.white} /></TouchableOpacity>
                    
                    <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                        <Ionicons name={status.playing ? 'pause' : 'play'} size={40} color={Colors.white} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity><Ionicons name="play-skip-forward" size={36} color={Colors.white} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
                        <Ionicons name="repeat" size={26} color={isRepeat ? Colors.teal : Colors.gray} />
                    </TouchableOpacity>
                </View>
            </View>

            {showQueue && (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 99 }]}>
                    <TouchableWithoutFeedback onPress={closeQueue}>
                        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[
                        styles.queueSheet, 
                        { 
                            transform: [{ translateY: slideAnim }],
                            paddingBottom: insets.bottom + 10 
                        }
                    ]}>
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
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <View style={styles.queueItem}>
                                    <View style={[styles.queueThumb, item.isCurrent && styles.queueThumbActive]}>
                                        <Ionicons name="musical-notes" size={16} color={item.isCurrent ? Colors.teal : '#555'} />
                                    </View>
                                    <View style={styles.queueInfo}>
                                        <Text style={[styles.queueItemTitle, item.isCurrent && { color: Colors.teal }]} numberOfLines={1}>
                                            {item.isCurrent && '♫  '}{item.title}
                                        </Text>
                                        <Text style={styles.queueItemArtist}>{item.artist}</Text>
                                    </View>
                                    {!item.isCurrent ? (
                                        <TouchableOpacity style={styles.menuIconBtn} onPress={() => openContextMenu(item)}>
                                            <Ionicons name="reorder-three" size={22} color={Colors.gray} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.menuIconBtn} />
                                    )}
                                </View>
                            )}
                        />
                    </Animated.View>
                </View>
            )}

            <Modal visible={showContextMenu} transparent animationType="fade" onRequestClose={() => setShowContextMenu(false)}>
                <TouchableWithoutFeedback onPress={() => setShowContextMenu(false)}>
                    <View style={styles.contextOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.contextMenu}>
                                <View style={styles.contextHeader}>
                                    <View style={styles.contextThumb}>
                                        <Ionicons name="musical-notes" size={16} color={Colors.teal} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.contextSongTitle} numberOfLines={1}>{contextItem?.title}</Text>
                                        <Text style={styles.contextArtist}>{contextItem?.artist}</Text>
                                    </View>
                                </View>

                                <View style={styles.contextDivider} />

                                <TouchableOpacity style={styles.contextAction} onPress={handleMoveToTop}>
                                    <Ionicons name="arrow-up-circle-outline" size={22} color={Colors.white} />
                                    <Text style={styles.contextActionText}>Move to top</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contextAction} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={22} color="#FF5555" />
                                    <Text style={[styles.contextActionText, { color: '#FF5555' }]}>Delete from queue</Text>
                                </TouchableOpacity>

                                <View style={styles.contextDivider} />

                                <TouchableOpacity style={[styles.contextAction, { justifyContent: 'center' }]} onPress={() => setShowContextMenu(false)}>
                                    <Text style={[styles.contextActionText, { color: Colors.gray }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
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
    artworkContainer: { width: ARTWORK_SIZE, height: ARTWORK_SIZE, borderRadius: 24, backgroundColor: '#222', overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderArt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    
    bottomSection: { paddingHorizontal: 30 },
    songInfoContainer: { marginBottom: 15 },
    songTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    songTitle: { color: Colors.white, fontSize: 26, fontWeight: 'bold', flex: 1, marginRight: 10 },
    artistName: { color: Colors.teal, fontSize: 16, marginTop: 4 },
    listIconRow: { alignItems: 'flex-end', marginBottom: 10 },
    
    sliderContainer: { marginBottom: 20 },
    slider: { width: width - 40, alignSelf: 'center', height: 40 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -5 },
    timeText: { color: '#888', fontSize: 12 },
    
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', elevation: 5 },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 },
    queueSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: QUEUE_HEIGHT, backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 101 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    queueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    queueTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#2A2A2A' },
    editText: { fontSize: 13, color: Colors.white, fontWeight: '600' },
    queueItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 14 },
    queueThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
    queueThumbActive: { borderColor: Colors.teal, backgroundColor: '#1A2A24' },
    queueInfo: { flex: 1 },
    queueItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.white, marginBottom: 3 },
    queueItemArtist: { fontSize: 12, color: Colors.gray },
    menuIconBtn: { width: 32, alignItems: 'center' },

    contextOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    contextMenu: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 18, overflow: 'hidden' },
    contextHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    contextThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.teal },
    contextSongTitle: { fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 2 },
    contextArtist: { fontSize: 12, color: Colors.gray },
    contextDivider: { height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 0 },
    contextAction: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
    contextActionText: { fontSize: 15, color: Colors.white, fontWeight: '500' },
});