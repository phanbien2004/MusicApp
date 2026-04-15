import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { useNotifications } from '@/context/notification-context';
import { TopTrack, getTopTracksAPI } from '@/services/trackService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const friendsData = [
  {
    id: '1',
    name: 'Iam HDA',
    status: 'Mãi như ngày hôm qua',
    artist: 'Sơn Tùng MTP',
    isOnline: true,
  },
  {
    id: '2',
    name: 'OneKill',
    status: 'Nà ná na na',
    artist: 'Do Mi Xi',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Trường',
    status: 'Chạy ngay đi',
    artist: 'Sơn Tùng MTP',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Thiêm',
    status: 'Thế giới này',
    artist: 'Đen Vâu',
    isOnline: true,
  },
];

const recommendedData = [
  { id: '1', title: 'Chill Vibes', subtitle: '24 songs' },
  { id: '2', title: 'V-Pop Hits', subtitle: '36 songs' },
  { id: '3', title: 'Late Night', subtitle: '18 songs' },
  { id: '4', title: 'Workout', subtitle: '42 songs' },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const trackContext = useCurrentTrack();

  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  const fetchTopTracks = useCallback(async () => {
    try {
      setTopLoading(true);
      setTopError(null);
      const data = await getTopTracksAPI();
      setTopTracks(data);
    } catch (e) {
      setTopError('Không tải được Top Tracks');
    } finally {
      setTopLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopTracks();
  }, [fetchTopTracks]);

  const handlePlayTopTrack = (track: TopTrack) => {
    if (!trackContext) return;
    trackContext.setCurrentTrack(
      {
        id: track.id,
        title: track.title,
        thumbnailUrl: track.thumbnailUrl,
        trackUrl: track.trackUrl,
        duration: track.duration,
        contributors: track.contributors,
      },
      false,
      { source: 'search' },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}>

        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <Text style={styles.logo}>AABT</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── BANNER ─── */}
        <View style={styles.banner}>
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Your Daily Mix</Text>
              <Text style={styles.bannerSubtitle}>Curated just for you today</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.listenBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={Colors.white} />
              <Text style={styles.listenBtnText}>Listen Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── FRIENDS ACTIVITY ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.friendsScroll, { alignItems: 'flex-start' }]}>
          {friendsData.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendCard}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={22} color={Colors.gray} />
                </View>
              </View>
              <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
              <Text style={styles.friendStatus} numberOfLines={1}>{friend.status}</Text>
              <Text style={styles.friendArtist} numberOfLines={1}>{friend.artist}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── TOP TRACKS ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy" size={18} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Top Tracks</Text>
          </View>
          <TouchableOpacity onPress={fetchTopTracks}>
            <Ionicons name="refresh-outline" size={18} color={Colors.teal} />
          </TouchableOpacity>
        </View>

        {topLoading ? (
          <View style={styles.topLoadingBox}>
            <ActivityIndicator size="large" color={Colors.teal} />
          </View>
        ) : topError ? (
          <View style={styles.topLoadingBox}>
            <Text style={styles.topErrorText}>{topError}</Text>
            <TouchableOpacity onPress={fetchTopTracks} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.topTracksList}>
            {topTracks.map((track, index) => {
              const owner = track.contributors.find(c => c.role === 'OWNER');
              const rankColor = RANK_COLORS[index] ?? Colors.gray;
              const isTopThree = index < 3;
              return (
                <TouchableOpacity
                  key={track.id}
                  style={[styles.topTrackItem, isTopThree && styles.topTrackItemHighlight]}
                  onPress={() => handlePlayTopTrack(track)}
                  activeOpacity={0.75}>

                  {/* Rank */}
                  <View style={[styles.rankBadge, { borderColor: rankColor }]}>
                    <Text style={[styles.rankText, { color: rankColor }]}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Thumbnail */}
                  <View style={styles.trackThumbWrapper}>
                    {track.thumbnailUrl ? (
                      <Image
                        source={{ uri: track.thumbnailUrl }}
                        style={styles.trackThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
                        <Ionicons name="musical-note" size={20} color={Colors.teal} />
                      </View>
                    )}
                    {/* Play overlay */}
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={14} color={Colors.white} />
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {owner?.name ?? 'Unknown Artist'}
                    </Text>
                  </View>

                  {/* Duration */}
                  <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ─── RECOMMENDED FOR YOU ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedScroll}>
          {recommendedData.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recommendCard}>
              <View style={styles.recommendImage}>
                <Ionicons name="musical-notes" size={32} color={Colors.teal} />
              </View>
              <Text style={styles.recommendTitle}>{item.title}</Text>
              <Text style={styles.recommendSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.teal,
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.teal,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  notifBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },

  // Banner
  banner: {
    marginHorizontal: 20,
    marginVertical: 12,
    height: 180,
    borderRadius: 16,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    padding: 20,
    justifyContent: 'space-between',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.grayLight,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  listenBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  viewAll: {
    fontSize: 13,
    color: Colors.green,
    fontWeight: '600',
  },

  // Friends
  friendsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  friendCard: {
    width: 165,
    height: 170,
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#9C9EA5',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 31,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.teal,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 10,
  },
  friendStatus: {
    fontSize: 14,
    color: Colors.teal,
    marginBottom: 5,
    fontWeight: '500',
  },
  friendArtist: {
    fontSize: 12,
    color: Colors.gray,
  },

  // ─── Top Tracks ───────────────────────────────────────────
  topLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  topErrorText: {
    color: Colors.grayLight,
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryBtnText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 13,
  },
  topTracksList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  topTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topTrackItemHighlight: {
    borderColor: '#33D29433',
    backgroundColor: '#1A1A1A',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
  },
  trackThumbWrapper: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  trackThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  trackThumbPlaceholder: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 12,
    color: Colors.teal,
    fontWeight: '500',
  },
  trackDuration: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 8,
  },

  // Recommended
  recommendedScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recommendCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendImage: {
    height: 120,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2,
  },
  recommendSubtitle: {
    fontSize: 11,
    color: Colors.gray,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});