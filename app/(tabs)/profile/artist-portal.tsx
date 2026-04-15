import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { usePlayer } from '@/context/player-context';
import { AlbumsContentDTO, ArtistProfileData, getMyArtistProfileAPI, PopularTrackDTO } from '@/services/artistService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatContributorNames = (track: PopularTrackDTO) => {
    const contributorNames = track.contributors?.map((contributor) => contributor.name).filter(Boolean) ?? [];
    return contributorNames.length > 0 ? contributorNames.join(', ') : 'Unknown Artist';
};

export default function ArtistPortalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { setCurrentTrack } = useCurrentTrack()!;
    const { lastActiveTab } = usePlayer();

    const [profileData, setProfileData] = useState<ArtistProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                const res = await getMyArtistProfileAPI();
                if (res) {
                    setProfileData(res);
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy my profile artist:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    const handleBack = () => {
        const tab = lastActiveTab || 'profile';
        router.navigate(`/(tabs)/${tab}` as any);
    };

    const handlePlayTrack = async (track: PopularTrackDTO) => {
        await setCurrentTrack({
            id: track.id,
            title: track.title,
            thumbnailUrl: track.thumbnailUrl,
            duration: track.duration,
            contributors: track.contributors || [],
            trackUrl: track.trackUrl,
        }, false, { source: 'artist' });
    };

    const handleOpenAlbum = (album: AlbumsContentDTO) => {
        router.push({
            pathname: '/album/album',
            params: {
                id: String(album.id),
                title: album.title,
                thumbnailUrl: album.thumbnailUrl,
                releaseYear: String(album.releaseYear),
                artistName: profileData?.stageName || '',
                isOwner: 'true' // Đánh dấu đây là album của chính tôi (có quyền sửa)
            },
        });
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.teal} />
            </View>
        );
    }

    if (!profileData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="person-circle-outline" size={54} color="#3A3A3A" />
                    <Text style={styles.emptyTitle}>Không tải được thông tin artist</Text>
                </View>
            </SafeAreaView>
        );
    }

    const popularTracks = profileData.popularTracks ?? [];
    const albums = profileData.albums?.content ?? [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
                {/* HERO COVER */}
                <View style={styles.hero}>
                    {profileData.coverUrl ? (
                        <Image source={{ uri: profileData.coverUrl }} style={styles.coverImage} />
                    ) : (
                        <LinearGradient colors={['#A855F7', '#3B82F6', '#000']} style={styles.coverImage} />
                    )}

                    <View style={[styles.headerOverlay, { paddingTop: insets.top || StatusBar.currentHeight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="chevron-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => router.push('/profile/artist-settings' as any)}
                        >
                            <Ionicons name="settings-outline" size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* PROFILE INFORMATION */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrap}>
                        {profileData.avatarUrl ? (
                            <Image source={{ uri: profileData.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Ionicons name="person" size={36} color="#555" />
                            </View>
                        )}
                    </View>

                    <View style={styles.badge}>
                        <Ionicons name="sparkles" size={14} color={Colors.teal} />
                        <Text style={styles.badgeText}>Portal Management</Text>
                    </View>

                    <Text style={styles.stageName}>{profileData.stageName || 'Unknown Artist'}</Text>

                    {/* UPLOAD BUTTONS */}
                    <View style={styles.actionsBoxRow}>
                        <TouchableOpacity 
                            style={{ flex: 1 }} 
                            activeOpacity={0.8} 
                            onPress={() => router.push({
                                pathname: "/profile/upload-track",
                                params: { id: profileData?.id, stageName: profileData?.stageName }
                            })}
                        >
                            <LinearGradient
                                colors={['#A855F7', '#3B82F6', '#60A5FA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.uploadBtn}
                            >
                                <Ionicons name="cloud-upload-outline" size={20} color={Colors.black} />
                                <Text style={styles.uploadBtnText}>Upload Track</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ flex: 1 }} 
                            activeOpacity={0.8} 
                            onPress={() => router.push('/profile/upload-album' as any)}
                        >
                            <LinearGradient
                                colors={['#7C3AED', '#A855F7', '#6366F1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.uploadBtn}
                            >
                                <Ionicons name="albums-outline" size={20} color={Colors.white} />
                                <Text style={[styles.uploadBtnText, { color: Colors.white }]}>Create Album</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* STATS */}
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profileData.followerCount || 0}</Text>
                        <Text style={styles.statLabel}>FANS & FOLLOWERS</Text>
                    </View>

                    {/* BIO */}
                    {profileData.bio ? (
                        <View style={styles.infoCard}>
                            <Text style={styles.sectionLabel}>BIO</Text>
                            <Text style={styles.infoText}>{profileData.bio}</Text>
                        </View>
                    ) : null}

                    {/* MY TRACKS */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>MY POPULAR TRACKS</Text>
                        {popularTracks.length > 0 ? (
                            popularTracks.map((track) => (
                                <TouchableOpacity key={track.id} style={styles.trackRow} onPress={() => handlePlayTrack(track)}>
                                    <Image source={{ uri: track.thumbnailUrl }} style={styles.trackThumb} />
                                    <View style={styles.trackInfo}>
                                        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                                        <Text style={styles.trackSubtitle} numberOfLines={1}>{formatContributorNames(track)}</Text>
                                    </View>
                                    <Ionicons name="play-circle" size={28} color={Colors.teal} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.infoText}>You haven't dropped any tracks yet.</Text>
                        )}
                    </View>

                    {/* MY ALBUMS */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>MY ALBUMS</Text>
                        {albums.length > 0 ? (
                            albums.map((album) => (
                                <TouchableOpacity key={album.id} style={styles.albumRow} onPress={() => handleOpenAlbum(album)}>
                                    <Image source={{ uri: album.thumbnailUrl }} style={styles.albumThumb} />
                                    <View style={styles.trackInfo}>
                                        <Text style={styles.trackTitle} numberOfLines={1}>{album.title}</Text>
                                        <Text style={styles.trackSubtitle}>Album • {album.releaseYear}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={22} color="#666" />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.infoText}>You haven't created any albums yet.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loader: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hero: {
        height: 260,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    profileSection: {
        marginTop: -44,
        paddingHorizontal: 20,
        gap: 16,
    },
    avatarWrap: {
        alignItems: 'center',
    },
    avatar: {
        width: 104,
        height: 104,
        borderRadius: 28,
        borderWidth: 4,
        borderColor: Colors.background,
    },
    avatarFallback: {
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#21443A',
        backgroundColor: '#0F211C',
    },
    badgeText: {
        color: Colors.teal,
        fontSize: 12,
        fontWeight: '800',
    },
    stageName: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
    },
    actionsBoxRow: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 4,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 6,
    },
    uploadBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.black,
    },
    statCard: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1E1E1E',
        borderRadius: 20,
        paddingVertical: 18,
    },
    statValue: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: '900',
    },
    statLabel: {
        color: Colors.gray,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1E1E1E',
        borderRadius: 24,
        padding: 18,
        gap: 10,
    },
    sectionLabel: {
        color: Colors.teal,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    infoText: {
        color: '#D0D0D0',
        fontSize: 14,
        lineHeight: 22,
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    trackInfo: {
        flex: 1,
        gap: 4,
    },
    trackThumb: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
    },
    trackTitle: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    trackSubtitle: {
        color: Colors.gray,
        fontSize: 12,
    },
    albumRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    albumThumb: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#1A1A1A',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyTitle: {
        color: '#B0B0B0',
        fontSize: 16,
        fontWeight: '700',
    },
});
