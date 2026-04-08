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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileAPI, ProfileResponse } from '@/services/profileService';
import { getMySubscriptionAPI } from '@/services/paymentService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
// Tính toán độ rộng của card playlist (chia 2 cột)
const PLAYLIST_CARD_WIDTH = (width - 48) / 2; 

export default function ProfileScreen() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
    const [playlists, setPlaylists] = useState<PlayList[] | null>(null);

    const fetchProfileData = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                // Fetch profile
                getProfileAPI(userId).then(res => setProfileData(res)).catch(e => console.log(e));
                
                // Fetch premium status độc lập để hiển thị viền Avatar và UI
                getMySubscriptionAPI().then(subscription => {
                     // Kiểm tra nếu isActive là true và nó là PREMIUM
                     setIsPremium(subscription?.isActive || false);
                }).catch(e => console.log("Lỗi tải gói premium: ", e?.message));
            }
        } catch (error) {
            console.error("Lỗi khi lấy profile chung:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();
        }, [fetchProfileData])
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
                            onPress={() => router.push('/profile/account-settings' as any)}>
                            <Ionicons name="settings-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── PROFILE CARD ─── */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        {isPremium ? (
                            <LinearGradient
                                colors={['#FACC15', '#A16207', '#FEF08A']}
                                style={styles.premiumBorder}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                {profileData?.avatarUrl ? (
                                    <Image source={{ uri: profileData.avatarUrl }} style={[styles.avatarImg, { borderWidth: 0 }]} />
                                ) : (
                                    <View style={[styles.avatar, { borderWidth: 0 }]}>
                                        <Ionicons name="person" size={34} color={Colors.gray} />
                                    </View>
                                )}
                            </LinearGradient>
                        ) : (
                            profileData?.avatarUrl ? (
                                <Image source={{ uri: profileData.avatarUrl }} style={styles.avatarImg} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={36} color={Colors.gray} />
                                </View>
                            )
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{profileData?.displayName}</Text>
                            {isPremium && <Text style={{ color: '#FACC15', fontSize: 11, fontWeight: '700' }}>PREMIUM</Text>}
                        </View>
                    </View>

                    {/* Thống kê */}
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
                            <Text style={styles.statLabel}>PLAYLISTS</Text>
                        </View>
                    </View>

                    {/* Artist Portal Logic */}
                    <View style={styles.actionsRow}>
                        {profileData?.artistProfileStatus === 'VERIFIED' ? (
                            <TouchableOpacity
                                style={[styles.artistBtn, { backgroundColor: '#33D294' }]}
                                onPress={() => router.push('/profile/artist-portal' as any)}>
                                <Ionicons name="star" size={16} color={Colors.white} />
                                <Text style={styles.artistBtnText}>Artist Portal</Text>
                            </TouchableOpacity>
                        ) : profileData?.artistProfileStatus === 'PENDING' ? (
                            <TouchableOpacity
                                style={[styles.artistBtn, { borderColor: Colors.teal, borderWidth: 1, backgroundColor: 'transparent' }]}
                                onPress={() => router.push({ pathname: '/profile/register-artist', params: { mode: 'update' } } as any)}>
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
                                onPress={() => router.push('/profile/register-artist' as any)}>
                                <Ionicons name="musical-notes-outline" size={16} color={Colors.white} />
                                <Text style={styles.artistBtnText}>Register Artist</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ─── MY PLAYLISTS ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Playlists</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/profile/addlist' as any)}>
                        <Ionicons name="add" size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.playlistsGrid}>
                    {profileData?.playlists?.map(item => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.playlistCard} 
                            onPress={() => router.push({ pathname: '/profile/list', params: { id: item.id } } as any)}
                        >
                            {/* Logic hiển thị Thumbnail: Nếu có thì hiện ảnh, không thì hiện màu xanh Teal */}
                            {item.thumbnailUrl ? (
                                <Image source={{ uri: item.thumbnailUrl }} style={styles.playlistThumb} />
                            ) : (
                                <View style={[styles.playlistThumb, { backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="musical-notes" size={30} color="rgba(255,255,255,0.5)" />
                                </View>
                            )}
                            <Text style={styles.playlistName} numberOfLines={1}>{item.title}</Text>
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
    
    // Profile Card
    profileCard: { marginHorizontal: 16, backgroundColor: '#0D0D0D', borderRadius: 20, borderWidth: 1, borderColor: '#1E1E1E', padding: 20, gap: 18, marginBottom: 20 },
    profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    premiumBorder: { padding: 3, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: '#333' },
    profileInfo: { gap: 4 },
    profileName: { fontSize: 22, fontWeight: '800', color: Colors.white },
    
    // Stats
    statsRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.teal },
    statLabel: { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: '#2A2A2A', marginVertical: 10 },
    
    // Buttons
    actionsRow: { flexDirection: 'row', gap: 12 },
    artistBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, backgroundColor: Colors.teal },
    artistBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
    
    // Playlists Grid
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    playlistsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
    playlistCard: { width: PLAYLIST_CARD_WIDTH, gap: 10 },
    playlistThumb: { width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
    playlistName: { fontSize: 14, fontWeight: '600', color: Colors.white, paddingLeft: 4 },
});
