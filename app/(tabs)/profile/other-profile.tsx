import { Colors } from '@/constants/theme';
import { acceptFriendAPI, addFriendAPI, deleteFriendAPI } from '@/services/friendService';
import { getMemberPlayListAPI, PlayList } from '@/services/listService';
import { getProfileAPI, ProfileResponse } from '@/services/profileService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const { width } = Dimensions.get('window');
const PLAYLIST_CARD_WIDTH = (width - 48) / 2;

export default function ProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Lấy ID từ URL (nếu có)
    
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
    const [playlists, setPlaylists] = useState<PlayList[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<string | null>(null);

    // --- KIỂM TRA QUYỀN SỞ HỮU ---
    // Nếu không có id trên URL, hoặc id trên URL trùng với id trong máy -> Là profile của mình
    const isOwnProfile = !id || id === myId;

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const loggedInUserId = await AsyncStorage.getItem('userId');
            setMyId(loggedInUserId);

            // Mục tiêu lấy dữ liệu: Ưu tiên id từ URL, nếu không có thì lấy của mình
            const targetId = (id as string) || loggedInUserId;

            if (targetId) {
                const resProfile = await getProfileAPI(targetId);
                setProfileData(resProfile);

                const resPlayList = await getMemberPlayListAPI(targetId);
                setPlaylists(resPlayList);
            }
        } catch (error) {
            console.error("Lỗi tải profile:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    // --- LOGIC XỬ LÝ KẾT BẠN ---
    const handleFriendAction = async () => {
        if (!profileData || !id) return;
        try {
            const status = profileData.friendStatus;
            if (status === 'NONE') {
                await addFriendAPI(id as string);
            } else if (status === 'PENDING_RECEIVED') {
                await acceptFriendAPI(id as string);
            } else {
                // Nếu đã gửi hoặc đã là bạn -> Hỏi trước khi hủy
                return Alert.alert("Xác nhận", "Bạn muốn hủy yêu cầu hoặc xóa bạn bè?", [
                    { text: "Hủy", style: "cancel" },
                    { text: "Đồng ý", style: "destructive", onPress: async () => {
                        await deleteFriendAPI(id as string);
                        fetchProfile();
                    }}
                ]);
            }
            fetchProfile(); // Tải lại để cập nhật trạng thái nút
        } catch (e) {
            console.error(e);
        }
    };

    // --- RENDER NÚT FRIEND (THEO TRẠNG THÁI) ---
    const renderFriendButton = () => {
        const status = profileData?.friendStatus;
        let label = "Add Friend";
        let icon = "person-add-outline";
        let btnStyle: any = styles.addFriendBtn;
        let textStyle: any = styles.friendBtnText;

        if (status === 'ACCEPTED') {
            label = "Friends";
            icon = "people";
            btnStyle = styles.acceptedBtn;
        } else if (status === 'PENDING_SENT') {
            label = "Request Sent";
            icon = "time-outline";
            btnStyle = styles.pendingBtn;
            textStyle = styles.pendingText;
        } else if (status === 'PENDING_RECEIVED') {
            label = "Accept Request";
            icon = "person-add";
            btnStyle = styles.addFriendBtn;
        }

        return (
            <TouchableOpacity style={[styles.mainBtnBase, btnStyle]} onPress={handleFriendAction}>
                <Ionicons name={icon as any} size={18} color={textStyle.color} />
                <Text style={textStyle}>{label}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator color={Colors.teal} size="large" /></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* ─── HEADER ICONS ─── */}
                <View style={styles.headerRow}>
                    {/* Hiện nút Back nếu là profile người khác */}
                    {!isOwnProfile ? (
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="chevron-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    ) : <View style={{ flex: 1 }} />}

                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        
                        {/* Hiện nút Settings nếu là profile của mình */}
                        {isOwnProfile && (
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => router.push('/profile/account-settings' as any)}>
                                <Ionicons name="settings-outline" size={22} color={Colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ─── PROFILE CARD ─── */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        {profileData?.avatarUrl ? (
                            <Image source={{ uri: profileData.avatarUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={36} color={Colors.gray} />
                            </View>
                        )}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{profileData?.displayName || 'User'}</Text>
                            {!isOwnProfile && <Text style={styles.userHandle}>@{profileData?.displayName?.toLowerCase().replace(/\s/g, '')}</Text>}
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

                    {/* Nút hành động chính */}
                    <View style={styles.actionsWrapper}>
                        {isOwnProfile ? (
                            // Logic Artist cho chính mình
                            profileData?.artistProfileStatus === 'VERIFIED' ? (
                                <TouchableOpacity style={[styles.mainBtnBase, { backgroundColor: '#33D294' }]} onPress={() => router.push('/profile/artist-portal' as any)}>
                                    <Ionicons name="star" size={16} color={Colors.white} />
                                    <Text style={styles.friendBtnText}>Artist Portal</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.mainBtnBase} onPress={() => router.push('/profile/register-artist' as any)}>
                                    <Ionicons name="musical-notes-outline" size={16} color={Colors.white} />
                                    <Text style={styles.friendBtnText}>Register Artist</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            // Logic Friend cho người khác
                            renderFriendButton()
                        )}
                    </View>
                </View>

                {/* ─── PLAYLISTS ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isOwnProfile ? 'My Playlists' : 'Public Playlists'}</Text>
                    {isOwnProfile && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/profile/addlist' as any)}>
                            <Ionicons name="add" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.playlistsGrid}>
                    {playlists && playlists.length > 0 ? (
                        playlists.map(item => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.playlistCard} 
                                onPress={() => router.push({ pathname: '/profile/list', params: { id: item.id } } as any)}
                            >
                                <View style={styles.playlistThumbContainer}>
                                    {item.thumbnailUrl ? (
                                        <Image source={{ uri: item.thumbnailUrl }} style={styles.playlistThumb} />
                                    ) : (
                                        <View style={[styles.playlistThumb, { backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Ionicons name="musical-notes" size={30} color="rgba(255,255,255,0.5)" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.playlistName} numberOfLines={1}>{item.title}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No playlists found</Text>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    scrollContent: { paddingBottom: 120 },
    centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between' },
    headerIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    
    profileCard: { marginHorizontal: 16, backgroundColor: '#0D0D0D', borderRadius: 20, borderWidth: 1, borderColor: '#1E1E1E', padding: 20, gap: 18, marginBottom: 20 },
    profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: '#333' },
    profileInfo: { gap: 2 },
    profileName: { fontSize: 22, fontWeight: '800', color: Colors.white },
    userHandle: { color: Colors.gray, fontSize: 13 },
    
    statsRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
    statNumber: { fontSize: 18, fontWeight: '800', color: Colors.teal },
    statLabel: { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: '#2A2A2A', marginVertical: 10 },
    
    actionsWrapper: { marginTop: 5 },
    mainBtnBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, backgroundColor: Colors.teal, width: '100%' },
    addFriendBtn: { backgroundColor: Colors.teal },
    acceptedBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
    pendingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.gray, borderStyle: 'dashed' },
    friendBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
    pendingText: { fontSize: 14, fontWeight: '700', color: Colors.gray },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    playlistsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
    playlistCard: { width: PLAYLIST_CARD_WIDTH, gap: 10 },
    playlistThumbContainer: { width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
    playlistThumb: { width: '100%', height: '100%' },
    playlistName: { fontSize: 14, fontWeight: '600', color: Colors.white, paddingLeft: 4 },
    emptyText: { color: Colors.gray, marginLeft: 16, fontSize: 13 }
});