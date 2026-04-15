import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/context/notification-context';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const { unreadCount } = useNotifications();

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
    marginBottom: 10
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