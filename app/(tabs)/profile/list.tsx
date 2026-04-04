import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlaylistDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showCollabModal, setShowCollabModal] = useState(false);
    
    const scrollY = useRef(new Animated.Value(0)).current;

    // --- DỮ LIỆU MẪU (MOCK DATA) ---
    const SONGS = [
        { id: 1, title: "Đau nhất là lặng im", artist: "Erik" },
        { id: 2, title: "Vạn sự như ý", artist: "Trúc Nhân" },
        { id: 3, title: "Có ai hẹn hò cùng em chưa", artist: "Quân A.P" },
        { id: 4, title: "Em của ngày hôm qua", artist: "Sơn Tùng MTP" },
    ];

    const COLLABS = [
        { id: '1', name: 'Bien', role: 'Owner' },
        { id: '2', name: 'Truong', role: 'Collabs' },
    ];

    const FRIENDS = [
        { id: 'f1', name: 'Iam HDA' },
        { id: 'f2', name: 'OneKill' },
        { id: 'f3', name: 'Biên Phan' },
        { id: 'f4', name: 'Quân Nguyễn' },
    ];

    // --- HIỆU ỨNG ANIMATION ---
    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [140, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const headerBgOpacity = scrollY.interpolate({
        inputRange: [100, 180],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // --- RENDER GIAO DIỆN BÀI HÁT ---
    const renderSongItem = (item: any) => {
        const isCurrent = item.id === 4;
        return (
            <TouchableOpacity style={styles.songItem} activeOpacity={0.7}>
                <View style={styles.songThumbnail}>
                    <Ionicons 
                        name={isCurrent ? "volume-high" : "musical-note"} 
                        size={20} 
                        color={isCurrent ? Colors.teal : "#555"} 
                    />
                </View>
                <View style={styles.songInfo}>
                    <Text style={[styles.songTitle, isCurrent && { color: Colors.teal }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity style={{ padding: 10 }}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* --- TOP HEADER (ANIMATED) --- */}
            <Animated.View style={[styles.headerBg, { height: insets.top + 60, opacity: headerBgOpacity }]} />
            <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Animated.View style={[styles.headerTitleCenter, { opacity: headerTitleOpacity }]}>
                    <Text style={styles.headerTitleText}>List 01</Text>
                </Animated.View>
                <View style={{ width: 44 }} />
            </View>

            {/* --- LIST NỘI DUNG CHÍNH --- */}
            <Animated.FlatList
                data={SONGS}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => renderSongItem(item)}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                ListHeaderComponent={
                    <View style={styles.topSection}>
                        <View style={styles.mainCover}>
                             <Ionicons name="disc-outline" size={90} color="#222" />
                        </View>

                        <View style={styles.titleRow}>
                            <Text style={styles.playlistTitleLarge}>List 01</Text>
                            <TouchableOpacity><Ionicons name="pencil-sharp" size={20} color="#FFF" /></TouchableOpacity>
                        </View>

                        {/* Avatar Stack & Collabs Trigger */}
                        <TouchableOpacity 
                            style={styles.creatorRow} 
                            onPress={() => setShowCollabModal(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarStack}>
                                <View style={[styles.miniAvatar, { backgroundColor: Colors.teal, zIndex: 2 }]} />
                                <View style={[styles.miniAvatar, { backgroundColor: '#ff6b6b', marginLeft: -12, zIndex: 1 }]} />
                                <View style={styles.plusIconOverlay}>
                                    <Ionicons name="add" size={12} color="#FFF" />
                                </View>
                            </View>
                            <Text style={styles.creatorNameText}>Bien</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonActionRow}>
                            <View style={styles.leftButtonGroup}>
                                <TouchableOpacity style={styles.actionBtnSmall}><Text style={styles.actionBtnText}>+ ADD</Text></TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.actionBtnSmall}
                                    onPress={() => setShowCollabModal(true)}
                                >
                                    <Ionicons name="options-outline" size={16} color="#FFF" />
                                    <Text style={[styles.actionBtnText, {marginLeft: 6}]}>EDIT</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.rightButtonGroup}>
                                <TouchableOpacity><Ionicons name="shuffle" size={28} color="#FFF" /></TouchableOpacity>
                                <TouchableOpacity style={styles.mainPlayBtn}>
                                    <Ionicons name="play" size={32} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                }
            />

            {/* --- MODAL COLLABORATION (EDIT INVITE) --- */}
            <Modal
                visible={showCollabModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCollabModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{flex: 1}} onPress={() => setShowCollabModal(false)} />
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalIndicator} />
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Current Members Section */}
                            <View style={styles.collabSection}>
                                {COLLABS.map((user) => (
                                    <View key={user.id} style={styles.collabUserRow}>
                                        <View style={styles.largeAvatarCircle} />
                                        <View style={styles.collabUserInfo}>
                                            <Text style={styles.collabUserNameText}>{user.name}</Text>
                                            <View style={styles.roleRow}>
                                                {user.role === 'Collabs' && <Ionicons name="chevron-down" size={16} color="#888" />}
                                                <Text style={styles.collabUserRoleText}>{user.role}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.modalDivider} />

                            {/* Invite Friends Section - CHUẨN THEO ẢNH */}
                            <View style={styles.inviteHeaderRow}>
                                <Text style={styles.inviteTitleText}>Invite friends</Text>
                                <TouchableOpacity><Ionicons name="search" size={26} color="#FFF" /></TouchableOpacity>
                            </View>

                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.friendsHorizontalList}
                            >
                                {FRIENDS.map((friend) => (
                                    <View key={friend.id} style={styles.friendCard}>
                                        {/* Avatar với viền Teal cách quãng */}
                                        <View style={styles.friendAvatarTealBorder}>
                                            <View style={styles.friendAvatarInner} />
                                        </View>
                                        
                                        <Text style={styles.friendCardName} numberOfLines={1}>{friend.name}</Text>
                                        
                                        <TouchableOpacity style={styles.pillInviteBtn}>
                                            <Ionicons name="person-add-outline" size={16} color="#FFF" />
                                            <Text style={styles.pillInviteText}>Invite</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    headerBg: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#000' },
    headerContent: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 100, zIndex: 11,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitleCenter: { flex: 1, alignItems: 'center' },
    headerTitleText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    
    scrollContent: { paddingHorizontal: 20 },
    topSection: { marginTop: 100, marginBottom: 25 },
    mainCover: {
        width: 220, height: 220, backgroundColor: '#111', borderRadius: 35,
        alignSelf: 'center', marginBottom: 25, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#222',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    playlistTitleLarge: { fontSize: 36, fontWeight: '900', color: '#FFF', marginRight: 15 },
    
    creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    avatarStack: { flexDirection: 'row', marginRight: 15, position: 'relative' },
    miniAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#000' },
    plusIconOverlay: { 
        position: 'absolute', right: 0, width: 30, height: 30, borderRadius: 15, 
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' 
    },
    creatorNameText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

    buttonActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    leftButtonGroup: { flexDirection: 'row', gap: 12 },
    rightButtonGroup: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    actionBtnSmall: { backgroundColor: '#1A1A1A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    mainPlayBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },

    songItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    songThumbnail: { width: 54, height: 54, backgroundColor: '#111', borderRadius: 12, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
    songInfo: { flex: 1 },
    songTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    songArtist: { color: Colors.gray, fontSize: 13 },

    /* --- MODAL STYLES RE-CRAFTED --- */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#161616', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 20 },
    modalIndicator: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
    
    collabSection: { paddingVertical: 10 },
    collabUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    largeAvatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D9D9D9' },
    collabUserInfo: { marginLeft: 16 },
    collabUserNameText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
    roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
    collabUserRoleText: { color: '#888', fontSize: 16 },
    
    modalDivider: { height: 1.5, backgroundColor: '#2A2A2A', marginBottom: 20 },
    
    inviteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
    inviteTitleText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    
    friendsHorizontalList: { gap: 15, paddingBottom: 20 },
    friendCard: { 
        backgroundColor: '#F5F5F5', // Nền sáng chuẩn theo ảnh
        paddingVertical: 20, 
        paddingHorizontal: 12, 
        borderRadius: 30, 
        width: 155, 
        alignItems: 'center' 
    },
    friendAvatarTealBorder: { 
        width: 64, height: 64, borderRadius: 32, 
        borderWidth: 2, borderColor: Colors.teal, 
        padding: 4, marginBottom: 12 
    },
    friendAvatarInner: { flex: 1, borderRadius: 30, backgroundColor: '#D9D9D9' },
    friendCardName: { color: '#000', fontSize: 17, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
    
    pillInviteBtn: { 
        flexDirection: 'row', alignItems: 'center', gap: 6, 
        backgroundColor: '#8E8E93', // Màu xám nút invite chuẩn
        paddingHorizontal: 20, paddingVertical: 9, borderRadius: 25, 
        width: '100%', justifyContent: 'center' 
    },
    pillInviteText: { color: '#FFF', fontSize: 14, fontWeight: '800' }
});