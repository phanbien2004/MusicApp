import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { AlbumsContentDTO, ArtistProfileData, followArtistAPI, FollowerUserDTO, getArtistFollowersAPI, getArtistProfileAPI, PopularTrackDTO, unfollowArtistAPI } from '@/services/artistService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatContributorNames = (track: PopularTrackDTO) => {
    const contributorNames = track.contributors?.map((contributor) => contributor.name).filter(Boolean) ?? [];
    return contributorNames.length > 0 ? contributorNames.join(', ') : 'Unknown Artist';
};

export default function ArtistProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ id?: string }>();
    const artistId = Number(params.id);
    const { setCurrentTrack } = useCurrentTrack()!;

    const [profileData, setProfileData] = useState<ArtistProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowed, setIsFollowed] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    const [modalVisible, setModalVisible] = useState(false);
    const [followers, setFollowers] = useState<FollowerUserDTO[]>([]);
    const [followersLoading, setFollowersLoading] = useState(false);

    const fetchArtistProfile = useCallback(async () => {
        if (!artistId || !Number.isFinite(artistId)) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await getArtistProfileAPI(artistId);
            setProfileData(response);
            setIsFollowed(response.followed ?? false);
            setFollowerCount(response.followerCount ?? 0);
        } catch (error) {
            console.error('Failed to load artist profile:', error);
            setProfileData(null);
        } finally {
            setLoading(false);
        }
    }, [artistId]);

    useFocusEffect(
        useCallback(() => {
            fetchArtistProfile();
        }, [fetchArtistProfile]),
    );

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
            },
        });
    };

    const handleToggleFollow = async () => {
        try {
            if (isFollowed) {
                setIsFollowed(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                await unfollowArtistAPI(artistId);
            } else {
                setIsFollowed(true);
                setFollowerCount(prev => prev + 1);
                await followArtistAPI(artistId);
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
            setIsFollowed(!isFollowed);
            setFollowerCount(prev => isFollowed ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    const handleOpenFollowers = async () => {
        setModalVisible(true);
        setFollowersLoading(true);
        try {
            const res = await getArtistFollowersAPI(artistId, 1, 50);
            setFollowers(res.content || []);
        } catch (error) {
            console.error('Failed to get followers:', error);
        } finally {
            setFollowersLoading(false);
        }
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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="person-circle-outline" size={54} color="#3A3A3A" />
                    <Text style={styles.emptyTitle}>Khong tai duoc thong tin artist</Text>
                </View>
            </SafeAreaView>
        );
    }

    const popularTracks = profileData.popularTracks ?? [];
    const albums = profileData.albums?.content ?? [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.hero}>
                    {profileData.coverUrl ? (
                        <Image source={{ uri: profileData.coverUrl }} style={styles.coverImage} />
                    ) : (
                        <LinearGradient colors={['#0D0D0D', '#0F2D24', '#000']} style={styles.coverImage} />
                    )}

                    <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

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
                        <Text style={styles.badgeText}>Artist</Text>
                    </View>

                    <Text style={styles.stageName}>{profileData.stageName || 'Unknown Artist'}</Text>
                    
                    <TouchableOpacity 
                        style={[styles.followButton, isFollowed && styles.followButtonActive]}
                        onPress={handleToggleFollow}
                    >
                        <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
                            {isFollowed ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={handleOpenFollowers}>
                        <Text style={styles.statValue}>{followerCount}</Text>
                        <Text style={styles.statLabel}>FANS (Click to view)</Text>
                    </TouchableOpacity>

                    {profileData.bio ? (
                        <View style={styles.infoCard}>
                            <Text style={styles.sectionLabel}>BIO</Text>
                            <Text style={styles.infoText}>{profileData.bio}</Text>
                        </View>
                    ) : null}

                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>POPULAR TRACKS</Text>
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
                            <Text style={styles.infoText}>Artist doesn't have popular track.</Text>
                        )}
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>ALBUMS</Text>
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
                            <Text style={styles.infoText}>Artist doesn't have album</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Followers</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    
                    {followersLoading ? (
                        <ActivityIndicator style={styles.modalLoader} size="large" color={Colors.teal} />
                    ) : (
                        <FlatList
                            data={followers}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.followersList}
                            ListEmptyComponent={
                                <Text style={styles.emptyFollowersText}>This artist has no fans yet.</Text>
                            }
                            renderItem={({ item }) => (
                                <View style={styles.followerRow}>
                                    {item.avatarUrl ? (
                                        <Image source={{ uri: item.avatarUrl }} style={styles.followerAvatar} />
                                    ) : (
                                        <View style={[styles.followerAvatar, styles.avatarFallback]}>
                                            <Ionicons name="person" size={20} color="#555" />
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.followerName}>{item.name}</Text>
                                        <Text style={styles.followerStatus}>{item.friendStatus}</Text>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>

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
    followButton: {
        alignSelf: 'center',
        backgroundColor: Colors.teal,
        paddingHorizontal: 32,
        paddingVertical: 10,
        borderRadius: 20,
    },
    followButtonActive: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.teal,
    },
    followButtonText: {
        color: Colors.black,
        fontSize: 14,
        fontWeight: '800',
    },
    followButtonTextActive: {
        color: Colors.teal,
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
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    modalTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '800',
    },
    modalLoader: {
        marginTop: 40,
    },
    followersList: {
        padding: 20,
        gap: 16,
    },
    emptyFollowersText: {
        color: Colors.gray,
        textAlign: 'center',
        marginTop: 20,
    },
    followerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    followerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    followerName: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    followerStatus: {
        color: Colors.gray,
        fontSize: 13,
    }
});
