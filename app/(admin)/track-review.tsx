import { Colors } from '@/constants/theme';
import { approveTrackAPI, getAllPendingTrackAPI, rejectTrackAPI, TrackPendingDTO } from '@/services/admin/adminService';
import { contributorDTO } from '@/services/trackService';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
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

const { width } = Dimensions.get('window');

export default function TrackReview() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // --- AUDIO LOGIC ---
    const player = useAudioPlayer();
    const status = useAudioPlayerStatus(player);

    // --- STATES ---
    const [tracks, setTracks] = useState<TrackPendingDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [activeTrackId, setActiveTrackId] = useState<number | null>(null);

    // --- FETCH DATA ---
    const fetchTracks = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const res: any = await getAllPendingTrackAPI(currentPage, 6);
            
            // Handling Pageable structure from Spring Boot
            if (res && res.content) {
                setTracks(res.content);
                setTotalPages(res.totalPages || 1);
                setTotalItems(res.totalElements || 0);
            } else {
                setTracks(res || []);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            Toast.show('Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTracks(page); }, [page, fetchTracks]);

    // --- ACTIONS ---
    const handleTogglePlay = (item: TrackPendingDTO) => {
        if (activeTrackId === item.trackId) {
            status.playing ? player.pause() : player.play();
        } else {
            setActiveTrackId(item.trackId);
            player.replace(item.trackUrl);
            player.play();
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const res = await approveTrackAPI(id);
            if(res) {
                player.pause();
                setTracks(prev => prev.filter(t => t.trackId !== id));
                Toast.show('🎉 Track approved successfully!');
            }
        } catch (error) {
            Toast.show('Error approving track');
        }
    };

    const handleReject = async (id: number) => {
        try {
            const res = await rejectTrackAPI(id);
            if(res) {
                player.pause();
                setTracks(prev => prev.filter(t => t.trackId !== id));
                Toast.show('Track rejected.');
            }
        } catch (error) {
            Toast.show('Error rejecting track');
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- RENDER HELPERS ---
    const renderArtistSubtitle = (contributors: contributorDTO[]) => {
        const owner = contributors.find(c => c.role === "OWNER")?.name || "Unknown";
        const featured = contributors.filter(c => c.role === "FEATURED").map(c => c.name);
        const producers = contributors.filter(c => c.role === "PRODUCER").map(c => c.name);

        return (
            <Text style={styles.artistSubtitle} numberOfLines={1}>
                <Text style={styles.ownerText}>{owner}</Text>
                {featured.length > 0 && (
                    <>
                        <Text style={styles.featLabel}> feat. </Text>
                        <Text style={styles.featuredName}>{featured.join(', ')}</Text>
                    </>
                )}
                {producers.length > 0 && (
                    <>
                        <Text style={styles.prodLabel}> (prod. </Text>
                        <Text style={styles.prodName}>{producers.join(', ')}</Text>
                        <Text style={styles.prodLabel}>)</Text>
                    </>
                )}
            </Text>
        );
    };

    const renderTrackItem = ({ item }: { item: TrackPendingDTO }) => {
        const isActive = activeTrackId === item.trackId;
        const isPlaying = isActive && status.playing;
        const progress = isActive ? (status.currentTime / (status.duration || 1)) * 100 : 0;

        return (
            <LinearGradient
                colors={isActive ? ['#1A1A1A', '#0F2D24'] : ['#111', '#111']}
                style={[styles.card, isActive && styles.cardActive]}
            >
                <View style={styles.cardMain}>
                    <TouchableOpacity style={styles.artContainer} onPress={() => handleTogglePlay(item)}>
                        <Image source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }} style={styles.artImage} />
                        <View style={[styles.playCircle, isPlaying && styles.pauseCircle]}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.infoContainer}>
                        <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
                        {renderArtistSubtitle(item.contributors || [])}
                        
                        {isActive && (
                            <View style={styles.visualizerRow}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <View key={i} style={[styles.vizBar, { height: isPlaying ? 4 + Math.random() * 10 : 4 }]} />
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.actionColumn}>
                        <TouchableOpacity style={styles.btnApprove} onPress={() => handleApprove(item.trackId)}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(item.trackId)}>
                            <Ionicons name="trash-outline" size={18} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isActive && (
                    <View style={styles.cardFooter}>
                        <View style={styles.progressBarFull}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeLabel}>{formatTime(status.currentTime)}</Text>
                            <Text style={styles.timeLabel}>{formatTime(item.duration)}</Text>
                        </View>
                    </View>
                )}
            </LinearGradient>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Review Lab</Text>
                    <Text style={styles.headerCount}>{totalItems} pending requests</Text>
                </View>
                <TouchableOpacity onPress={() => fetchTracks(page)} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color={Colors.teal} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            {loading && page === 1 ? (
                <View style={styles.loaderWrap}><ActivityIndicator color={Colors.teal} size="large" /></View>
            ) : (
                <FlatList
                    data={tracks}
                    keyExtractor={(item) => String(item.trackId)}
                    renderItem={renderTrackItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="sparkles" size={40} color="#333" />
                            <Text style={styles.emptyText}>All caught up! No pending tracks.</Text>
                        </View>
                    }
                />
            )}

            {/* Pagination Dock */}
            <View style={[styles.paginationDock, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={[styles.dockBtn, page <= 1 && styles.dockBtnDisabled]} 
                    onPress={() => setPage(p => p - 1)}
                    disabled={page <= 1}
                >
                    <Ionicons name="chevron-back" size={22} color={page <= 1 ? "#444" : "#FFF"} />
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                    <Text style={styles.pageCurrent}>{page}</Text>
                    <Text style={styles.pageDivider}>/</Text>
                    <Text style={styles.pageTotal}>{totalPages}</Text>
                </View>

                <TouchableOpacity 
                    style={[styles.dockBtn, page >= totalPages && styles.dockBtnDisabled]} 
                    onPress={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                >
                    <Ionicons name="chevron-forward" size={22} color={page >= totalPages ? "#444" : "#FFF"} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    headerCount: { fontSize: 11, color: Colors.teal, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    refreshBtn: { width: 40, height: 40, backgroundColor: '#111', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
    
    listContent: { paddingHorizontal: 20, paddingTop: 10 },
    card: { borderRadius: 28, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A', overflow: 'hidden' },
    cardActive: { borderColor: Colors.teal + '40' },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    
    artContainer: { width: 70, height: 70, borderRadius: 20, overflow: 'hidden' },
    artImage: { width: '100%', height: '100%' },
    playCircle: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    pauseCircle: { backgroundColor: 'rgba(51, 210, 148, 0.2)' },
    
    infoContainer: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    titleText: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 2 },
    
    artistSubtitle: { fontSize: 13, marginBottom: 6 },
    ownerText: { color: '#FFF', fontWeight: '700' },
    featLabel: { color: Colors.teal, fontWeight: '900', fontSize: 11, fontStyle: 'italic' },
    featuredName: { color: '#BBB', fontWeight: '500' },
    prodLabel: { color: '#666', fontSize: 11 },
    prodName: { color: '#888', fontWeight: '500' },

    visualizerRow: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 12 },
    vizBar: { width: 3, backgroundColor: Colors.teal, borderRadius: 1.5 },

    actionColumn: { gap: 10, paddingLeft: 10 },
    btnApprove: { width: 42, height: 42, borderRadius: 16, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
    btnReject: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },

    cardFooter: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    progressBarFull: { height: 3, backgroundColor: '#222', borderRadius: 1.5 },
    progressFill: { height: '100%', backgroundColor: Colors.teal },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    timeLabel: { fontSize: 10, color: '#555', fontWeight: 'bold' },

    paginationDock: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: '#161616',
        borderRadius: 35,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10
    },
    dockBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
    dockBtnDisabled: { opacity: 0.2 },
    pageIndicator: { flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', gap: 5 },
    pageCurrent: { color: Colors.teal, fontSize: 18, fontWeight: '900' },
    pageDivider: { color: '#333', fontSize: 16 },
    pageTotal: { color: '#666', fontSize: 14, fontWeight: '700' },

    loaderWrap: { flex: 1, justifyContent: 'center' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 10 },
    emptyText: { color: '#444', fontSize: 14, fontWeight: '800', textAlign: 'center' }
});