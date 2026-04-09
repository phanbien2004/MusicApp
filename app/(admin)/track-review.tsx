import apiClient from '@/api/apiClient';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-root-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TrackReviewItem {
    trackId: number;
    title: string;
    duration: number;
    trackUrl: string;
    thumbnailUrl: string;
    tags: { id: number; name: string }[];
}

export default function TrackReview() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // --- AUDIO PLAYER LOGIC ---
    const player = useAudioPlayer();
    const status = useAudioPlayerStatus(player);

    // --- DATA STATES ---
    const [tracks, setTracks] = useState<TrackReviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [activeTrackId, setActiveTrackId] = useState<number | null>(null);

    const fetchTracks = async (pageIndex = 1) => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/v1/admin/getAllPendingTrack', { 
                params: { index: pageIndex, size: 6 } 
            });
            if (res.data?.content) {
                setTracks(res.data.content);
                setTotalPages(res.data.totalPages || 1);
                setTotalItems(res.data.totalElements || 0);
            }
        } catch (error) {
            console.error("Failed to load tracks:", error);
            Toast.show('Failed to load pending tracks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTracks(page); }, [page]);

    // --- PLAYBACK HANDLER ---
    const handleTogglePlay = (item: TrackReviewItem) => {
        if (activeTrackId === item.trackId) {
            if (status.playing) player.pause();
            else player.play();
        } else {
            setActiveTrackId(item.trackId);
            player.replace(item.trackUrl);
            player.play(); // Kích hoạt phát nhạc ngay lập tức
        }
    };

    // --- ACTION HANDLERS ---
    const handleApprove = async (id: number) => {
        try {
            await apiClient.put(`/api/v1/admin/approveTrack/${id}`);
            Toast.show('Approved!');
            fetchTracks(page);
        } catch (error) {
            Toast.show('Approval failed.');
        }
    };

    const handleReject = (id: number) => {
        Toast.show('Track rejected.');
        // Implement API reject nếu có
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- RENDER ITEM ---
    const renderTrackItem = ({ item }: { item: TrackReviewItem }) => {
        const isCurrentActive = activeTrackId === item.trackId;
        const isActuallyPlaying = isCurrentActive && status.playing;
        const progress = isCurrentActive ? (status.currentTime / (status.duration || 1)) * 100 : 0;

        return (
            <View style={[styles.card, isCurrentActive && styles.cardActive]}>
                <View style={styles.cardHeader}>
                    {/* Thumbnail + Play Overlay */}
                    <TouchableOpacity 
                        style={styles.thumbnailWrapper} 
                        onPress={() => handleTogglePlay(item)}
                        activeOpacity={0.8}
                    >
                        <Image 
                            source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }} 
                            style={styles.thumbnail} 
                        />
                        <View style={styles.playOverlay}>
                            <Ionicons 
                                name={isActuallyPlaying ? "pause" : "play"} 
                                size={22} 
                                color="#FFF" 
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Track Info */}
                    <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.trackDuration}>Duration: {formatDuration(item.duration)}</Text>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionColumn}>
                        <TouchableOpacity style={styles.actionBtnReject} onPress={() => handleReject(item.trackId)}>
                            <Ionicons name="close-outline" size={20} color="#FF5555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnApprove} onPress={() => handleApprove(item.trackId)}>
                            <Ionicons name="checkmark-outline" size={20} color={Colors.teal} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Expanded Content (Tags & Progress) */}
                {isCurrentActive && (
                    <View style={styles.expandedArea}>
                        <View style={styles.tagRow}>
                            {item.tags?.map(tag => (
                                <View key={tag.id} style={styles.tagBadge}>
                                    <Text style={styles.tagText}>#{tag.name}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                            <View style={styles.timeLabelRow}>
                                <Text style={styles.timeText}>{formatDuration(status.currentTime)}</Text>
                                <Text style={styles.timeText}>{formatDuration(item.duration)}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>TRACK REVIEW</Text>
                    <Text style={styles.headerSubtitle}>{totalItems} PENDING REQUESTS</Text>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}><ActivityIndicator color={Colors.teal} size="large" /></View>
            ) : (
                <FlatList
                    data={tracks}
                    keyExtractor={(item) => String(item.trackId)}
                    renderItem={renderTrackItem}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>All caught up!</Text>}
                />
            )}

            {/* Pagination */}
            <View style={[styles.paginationRow, { paddingBottom: insets.bottom + 15 }]}>
                <TouchableOpacity 
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} 
                    onPress={() => setPage(p => p - 1)} 
                    disabled={page <= 1}
                >
                    <Ionicons name="chevron-back" size={20} color={page <= 1 ? "#444" : "#FFF"} />
                </TouchableOpacity>
                
                <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
                
                <TouchableOpacity 
                    style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]} 
                    onPress={() => setPage(p => p + 1)} 
                    disabled={page >= totalPages}
                >
                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? "#444" : "#FFF"} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
    backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { color: Colors.teal, fontSize: 11, fontWeight: '700', marginTop: 2 },
    
    listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
    card: { backgroundColor: '#111', borderRadius: 24, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1A' },
    cardActive: { borderColor: Colors.teal, backgroundColor: '#0A1A16' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    
    thumbnailWrapper: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', backgroundColor: '#222' },
    thumbnail: { width: '100%', height: '100%' },
    playOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    
    trackInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    trackTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    trackDuration: { color: '#666', fontSize: 12, marginTop: 4 },
    
    actionColumn: { gap: 8 },
    actionBtnApprove: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A2A22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E4D3E' },
    actionBtnReject: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4D2E2E' },

    expandedArea: { marginTop: 15, paddingHorizontal: 5 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    tagBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
    tagText: { color: Colors.teal, fontSize: 10, fontWeight: '800' },
    
    progressSection: { marginTop: 5 },
    progressBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.teal },
    timeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { color: '#555', fontSize: 10, fontWeight: 'bold' },

    paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 25, position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.9)', paddingTop: 10 },
    pageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
    pageBtnDisabled: { opacity: 0.3 },
    pageIndicator: { color: '#FFF', fontSize: 14, fontWeight: 'bold', minWidth: 50, textAlign: 'center' },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 100, fontSize: 16, fontWeight: '600' }
});