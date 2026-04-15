import { Colors } from '@/constants/theme';
import {
    AlbumTrackDTO,
    approveAlbumAPI,
    getAlbumTracksAPI,
    rejectAlbumAPI,
} from '@/services/admin/adminService';
import { contributorDTO } from '@/services/trackService';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-root-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const renderArtists = (contributors: contributorDTO[]) => {
    const owner = contributors.find((item) => item.role === 'OWNER')?.name;
    const featured = contributors
        .filter((item) => item.role === 'FEATURED')
        .map((item) => item.name)
        .join(', ');

    if (owner && featured) {
        return `${owner} feat. ${featured}`;
    }

    return owner || featured || 'Unknown Artist';
};

export default function AlbumDetailReview() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        id?: string;
        title?: string;
        thumbnailUrl?: string;
        releaseYear?: string;
    }>();

    const albumId = Number(params.id);
    const player = useAudioPlayer();
    const status = useAudioPlayerStatus(player);

    const [tracks, setTracks] = useState<AlbumTrackDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState<number | null>(null);

    const pausePreviewSafely = useCallback(() => {
        try {
            player.pause();
        } catch {
            // `useAudioPlayer` auto-releases on unmount, so pause can throw during teardown.
        }
    }, [player]);

    const fetchAlbumTracks = useCallback(async () => {
        if (!albumId || !Number.isFinite(albumId)) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await getAlbumTracksAPI(albumId);
            setTracks(res || []);
        } catch (error) {
            console.error('Fetch album tracks failed:', error);
            Toast.show('Cannot load album details.');
        } finally {
            setLoading(false);
        }
    }, [albumId]);

    useEffect(() => {
        fetchAlbumTracks();
    }, [fetchAlbumTracks]);

    const handleToggleTrack = (track: AlbumTrackDTO) => {
        if (activeTrackId === track.id) {
            if (status.playing) {
                player.pause();
            } else {
                player.play();
            }
            return;
        }

        setActiveTrackId(track.id);
        player.replace(track.trackUrl);
        player.play();
    };

    const handleApprove = async () => {
        if (!albumId || submitting) return;

        setSubmitting(true);
        try {
            await approveAlbumAPI(albumId);
            pausePreviewSafely();
            Toast.show('Album approved successfully.');
            router.back();
        } catch (error) {
            console.error('Approve album failed:', error);
            Toast.show('Approve album failed.');
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!albumId || submitting) return;

        setSubmitting(true);
        try {
            await rejectAlbumAPI(albumId);
            pausePreviewSafely();
            Toast.show('Album rejected.');
            router.back();
        } catch (error) {
            console.error('Reject album failed:', error);
            Toast.show('Reject album failed.');
            setSubmitting(false);
        }
    };

    const renderTrackItem = ({ item, index }: { item: AlbumTrackDTO; index: number }) => {
        const isActive = activeTrackId === item.id;
        const isPlaying = isActive && status.playing;

        return (
            <LinearGradient
                colors={isActive ? ['#151515', '#10221D'] : ['#111', '#111']}
                style={[styles.trackCard, isActive && styles.trackCardActive]}
            >
                <TouchableOpacity style={styles.trackPlayButton} onPress={() => handleToggleTrack(item)}>
                    <Image
                        source={{ uri: item.thumbnailUrl || params.thumbnailUrl || 'https://via.placeholder.com/128x128/111111/666666' }}
                        style={styles.trackCover}
                    />
                    <View style={[styles.playOverlay, isPlaying && styles.playOverlayActive]}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#FFF" />
                    </View>
                </TouchableOpacity>

                <View style={styles.trackInfo}>
                    <Text style={styles.trackIndex}>TRACK {String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.trackTitle} numberOfLines={1}>{item.title || 'Untitled Track'}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{renderArtists(item.contributors || [])}</Text>
                </View>

                <Text style={styles.trackDuration}>{formatDuration(item.duration || 0)}</Text>
            </LinearGradient>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        pausePreviewSafely();
                        router.back();
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Album Decision</Text>
                    <Text style={styles.headerSubtitle}>Review before approval</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator color={Colors.teal} size="large" />
                </View>
            ) : (
                <FlatList
                    data={tracks}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderTrackItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 150 }]}
                    ListHeaderComponent={
                        <View style={styles.heroCard}>
                            <Image
                                source={{ uri: params.thumbnailUrl || 'https://via.placeholder.com/320x320/111111/666666' }}
                                style={styles.heroCover}
                            />
                            <View style={styles.heroBody}>
                                <View style={styles.pendingBadge}>
                                    <Ionicons name="time-outline" size={14} color={Colors.teal} />
                                    <Text style={styles.pendingText}>Pending Review</Text>
                                </View>
                                <Text style={styles.albumTitle}>{params.title || 'Untitled Album'}</Text>
                                <Text style={styles.albumMeta}>
                                    Album ID #{albumId || 'N/A'} • Release {params.releaseYear || 'N/A'}
                                </Text>
                                <Text style={styles.albumMetaSecondary}>
                                    {tracks.length} track{tracks.length === 1 ? '' : 's'} inside this album
                                </Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="musical-notes-outline" size={42} color="#333" />
                            <Text style={styles.emptyTitle}>This album has no tracks</Text>
                            <Text style={styles.emptySubtitle}>Admin can still reject it or wait for the artist to update.</Text>
                        </View>
                    }
                />
            )}

            <View style={[styles.actionDock, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.rejectBtn, submitting && styles.actionDisabled]}
                    onPress={handleReject}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FF6666" />
                    ) : (
                        <>
                            <Ionicons name="close-circle-outline" size={22} color="#FF6666" />
                            <Text style={styles.rejectText}>Reject Album</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.approveBtn, submitting && styles.actionDisabled]}
                    onPress={handleApprove}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
                            <Text style={styles.approveText}>Approve Album</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15,
    },
    backBtn: {
        width: 45,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: Colors.teal,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 14,
    },
    heroCard: {
        marginTop: 8,
        marginBottom: 18,
        borderRadius: 32,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1E1E1E',
        overflow: 'hidden',
    },
    heroCover: {
        width: '100%',
        height: 260,
        backgroundColor: '#191919',
    },
    heroBody: {
        padding: 20,
        gap: 10,
    },
    pendingBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0F211C',
        borderWidth: 1,
        borderColor: '#21443A',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    pendingText: {
        color: Colors.teal,
        fontSize: 12,
        fontWeight: '800',
    },
    albumTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
    },
    albumMeta: {
        color: '#A0A0A0',
        fontSize: 13,
        fontWeight: '600',
    },
    albumMetaSecondary: {
        color: '#6F6F6F',
        fontSize: 12,
        fontWeight: '600',
    },
    trackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1D1D1D',
        gap: 14,
    },
    trackCardActive: {
        borderColor: '#245E50',
    },
    trackPlayButton: {
        width: 72,
        height: 72,
        borderRadius: 18,
        overflow: 'hidden',
    },
    trackCover: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1A1A1A',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playOverlayActive: {
        backgroundColor: 'rgba(26, 175, 116, 0.18)',
    },
    trackInfo: {
        flex: 1,
        gap: 4,
    },
    trackIndex: {
        color: Colors.teal,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    trackTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    trackArtist: {
        color: '#8E8E8E',
        fontSize: 12,
        fontWeight: '600',
    },
    trackDuration: {
        color: '#7B7B7B',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 24,
        gap: 10,
    },
    emptyTitle: {
        color: '#D0D0D0',
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#666',
        textAlign: 'center',
    },
    actionDock: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 0,
        flexDirection: 'row',
        gap: 12,
        paddingTop: 12,
        backgroundColor: 'rgba(0,0,0,0.92)',
    },
    rejectBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#231415',
        borderWidth: 1,
        borderColor: '#4E2A2D',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    approveBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.teal,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    actionDisabled: {
        opacity: 0.65,
    },
    rejectText: {
        color: '#FF6666',
        fontSize: 14,
        fontWeight: '800',
    },
    approveText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
