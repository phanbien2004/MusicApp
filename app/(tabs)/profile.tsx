import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
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

import { getProfileAPI, ProfileResponse } from '@/services/profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const PLAYLIST_CARD = (width - 48 - 12) / 2;

const playlists = [
    { id: '1', name: 'List 1', color: '#1DB954' },
    { id: '2', name: 'List 2', color: '#1A1A1A' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                const res = await getProfileAPI(userId);
                setProfileData(res);
            }
        } catch (error) {
            console.error("Lỗi khi lấy profile:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* ─── HEADER ICONS ─── */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => router.push('/(tabs)/profile/account-settings' as any)}>
                            <Ionicons name="settings-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── PROFILE CARD ─── */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        {profileData?.avatarUrl ? (
                            <Image source={{ uri: profileData.avatarUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={36} color={Colors.gray} />
                            </View>
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{profileData?.displayName}</Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData?.followedArtistCount || 0}</Text>
                            <Text style={styles.statLabel}>FOLLOWING</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData?.friendCount || 0}</Text>
                            <Text style={styles.statLabel}>FRIENDS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData?.playlistCount || 0}</Text>
                            <Text style={styles.statLabel}>PLAYLIST</Text>
                        </View>
                    </View>

                    {/* Action buttons (Only Artist stuff) */}
                    <View style={styles.actionsRow}>
                        {profileData?.artistProfileStatus === 'VERIFIED' ? (
                            <TouchableOpacity
                                style={[styles.artistBtn, { backgroundColor: '#33D294' }]}
                                onPress={() => router.push('/(tabs)/profile/artist-portal' as any)}>
                                <Ionicons name="star" size={16} color={Colors.white} />
                                <Text style={styles.artistBtnText}>Artist Portal</Text>
                            </TouchableOpacity>
                        ) : profileData?.artistProfileStatus === 'PENDING' ? (
                            <TouchableOpacity
                                style={[styles.artistBtn, { borderColor: Colors.teal, borderWidth: 1, backgroundColor: 'transparent' }]}
                                onPress={() => router.push({
                                    pathname: '/(tabs)/profile/register-artist',
                                    params: { mode: 'update' }
                                } as any)}>
                                <Ionicons name="time-outline" size={16} color={Colors.teal} />
                                <Text style={[styles.artistBtnText, { color: Colors.teal }]}>Pending Edit</Text>
                            </TouchableOpacity>
                        ) : profileData?.artistProfileStatus === 'REJECTED' ? (
                            <TouchableOpacity
                                style={[styles.artistBtn, { backgroundColor: '#8B0000' }]}
                                onPress={() => router.push({
                                    pathname: '/(tabs)/profile/register-artist',
                                    params: { mode: 'retry' }
                                } as any)}>
                                <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                                <Text style={styles.artistBtnText}>Rejected — Retry</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.artistBtn}
                                onPress={() => router.push('/(tabs)/profile/register-artist' as any)}>
                                <Ionicons name="musical-notes-outline" size={16} color={Colors.white} />
                                <Text style={styles.artistBtnText}>Register Artist</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ─── MY PLAYLISTS ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Playlists</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/profile/addlist' as any)}>
                        <Ionicons name="add" size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.playlistsGrid}>
                    {playlists.map(item => (
                        <TouchableOpacity key={item.id} style={styles.playlistCard} onPress={() => router.push('/(tabs)/profile/list' as any)}>
                            <View style={[styles.playlistThumb, { backgroundColor: item.color }]} />
                            <Text style={styles.playlistName}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    scrollContent: { paddingBottom: 120 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    headerIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    profileCard: { marginHorizontal: 16, backgroundColor: '#0D0D0D', borderRadius: 20, borderWidth: 1, borderColor: '#1E1E1E', padding: 20, gap: 18, marginBottom: 20 },
    profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: '#333' },
    profileInfo: { gap: 4 },
    profileName: { fontSize: 22, fontWeight: '800', color: Colors.white },
    statsRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.teal },
    statLabel: { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: '#2A2A2A', marginVertical: 10 },
    actionsRow: { flexDirection: 'row', gap: 12 },
    artistBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, backgroundColor: Colors.teal },
    artistBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    playlistsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
    playlistCard: { width: PLAYLIST_CARD, gap: 10 },
    playlistThumb: { width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A' },
    playlistName: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
