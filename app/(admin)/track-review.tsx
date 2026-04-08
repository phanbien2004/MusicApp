import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-root-toast';
import apiClient from '@/api/apiClient';

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
    const [playingId, setPlayingId] = useState<number | null>(null);
    
    const [tracks, setTracks] = useState<TrackReviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchTracks = async (pageIndex = 1) => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/v1/admin/getAllPendingTrack', { params: { index: pageIndex, size: 6 } });
            if (res.data?.content) {
                setTracks(res.data.content);
                setTotalPages(res.data.totalPages || 1);
                setTotalItems(res.data.totalElements || 0);
            }
        } catch (error) {
            console.error("Failed to load tracks:", error);
            Toast.show('Failed to load pending tracks.', { duration: Toast.durations.SHORT });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTracks(page);
    }, [page]);

    const handleApprove = async (id: number) => {
        try {
            await apiClient.put(`/api/v1/admin/approveTrack/${id}`);
            Toast.show('Track approved successfully!', { duration: Toast.durations.SHORT });
            fetchTracks(page); // Reload sau khi duyệt
        } catch (error) {
            console.error("Approve track error:", error);
            Toast.show('Failed to approve track.', { duration: Toast.durations.SHORT });
        }
    };

    const handleReject = async (id: number) => {
        // Tuỳ thuộc backend có endpoint reject không, tạm mock
        Toast.show('Rejected track!', { duration: Toast.durations.SHORT });
        // Implement tiếp API /rejectTrack nếu có
    };

    const formatDuration = (sec: number) => {
        if (!sec) return '0:00';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderTrackItem = ({ item }: { item: TrackReviewItem }) => {
        const isExpanded = playingId === item.trackId;

        return (
            <View style={[styles.card, isExpanded && styles.cardActive]}>
                <View style={styles.cardHeader}>
                    {/* Play Button */}
                    <TouchableOpacity 
                        style={[styles.playBtn, isExpanded && styles.playBtnActive]}
                        onPress={() => setPlayingId(isExpanded ? null : item.trackId)}
                    >
                        <Ionicons name={isExpanded ? "pause" : "play"} size={24} color={isExpanded ? Colors.teal : "#FFF"} />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{item.title}</Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>Duration: {formatDuration(item.duration)}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.trackId)}>
                            <Ionicons name="close" size={20} color="#FF5555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.trackId)}>
                            <Ionicons name="checkmark" size={20} color={Colors.teal} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Phần mở rộng khi đang nghe thử */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.tagRow}>
                            {item.tags?.map(tag => (
                                <View key={tag.id} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag.name}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Progress Bar (Mock player UI) */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressFill, { width: '0%' }]} />
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>0:00</Text>
                                <Text style={styles.timeText}>{formatDuration(item.duration)}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };
    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>TRACK REVIEW</Text>
                    <Text style={styles.headerSubtitle}>{totalItems} PENDING SUBMISSIONS</Text>
                </View>
            </View>

            {/* ─── LIST ─── */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={Colors.teal} size="large" />
                </View>
            ) : (
                <FlatList
                    data={tracks}
                    keyExtractor={(item) => String(item.trackId)}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderTrackItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={{ color: '#888', textAlign: 'center', marginTop: 50 }}>No pending tracks</Text>
                    }
                />
            )}

            {/* ─── PAGINATION ─── */}
            <View style={[styles.pagination, { marginBottom: insets.bottom + 10 }]}>
                <TouchableOpacity onPress={handlePrev} disabled={page <= 1}>
                    <Ionicons name="chevron-back" size={20} color={page <= 1 ? "#555" : "#FFF"} />
                </TouchableOpacity>
                <Text style={styles.pageText}>{page} / {totalPages}</Text>
                <TouchableOpacity onPress={handleNext} disabled={page >= totalPages}>
                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? "#555" : "#FFF"} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
    backBtn: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    headerSubtitle: { color: Colors.teal, fontSize: 11, fontWeight: '700' },
    
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#121212', borderRadius: 28, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
    cardActive: { borderColor: '#333' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    
    playBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
    playBtnActive: { backgroundColor: '#1A2A2A', borderWidth: 1, borderColor: Colors.teal },
    
    trackInfo: { flex: 1, marginLeft: 16 },
    trackTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    trackArtist: { color: '#888', fontSize: 12, marginTop: 2 },
    
    actionRow: { flexDirection: 'row', gap: 8 },
    rejectBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4D2E2E' },
    approveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A2A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E4D2E' },

    expandedContent: { marginTop: 15, paddingHorizontal: 4 },
    tagRow: { flexDirection: 'row', gap: 10, marginBottom: 15, flexWrap: 'wrap' },
    tag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#A855F7' },
    tagText: { color: '#A855F7', fontSize: 12, fontWeight: 'bold' },
    
    progressContainer: { marginTop: 5 },
    progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.teal },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { color: '#666', fontSize: 11, fontWeight: 'bold' },

    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 10 },
    pageText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});