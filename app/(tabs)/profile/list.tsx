import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import {
    PlayListDetail,
    addCollaboratorToPlayListAPI,
    addTrackToPlayListAPI,
    getPlayListDetailAPI,
    removeTrackFromPlayListAPI,
    searchTrackToAddAPI,
    updatePlayListAPI,
} from '@/services/listService';
import { TrackContentType, searchAPI } from '@/services/searchService';
import { getPresignedUploadUrl, uploadFileToMinIO } from '@/services/storageService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Thêm để lấy My ID
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MOCK_FRIENDS = [
    { id: 1, name: 'Iam HDA' },
    { id: 2, name: 'OneKill' },
    { id: 3, name: 'Alex99' },
    { id: 4, name: 'MinhThu' },
];

export default function PlaylistDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const { setCurrentTrack } = useCurrentTrack()!;

    // --- DATA STATES ---
    const [detail, setDetail] = useState<PlayListDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [existedTrackIds, setExistedTrackIds] = useState<number[]>([]);
    const [myId, setMyId] = useState<string | null>(null);

    // --- LOGIC KIỂM TRA QUYỀN CHỈNH SỬA ---
    // Kiểm tra xem user hiện tại có phải chủ sở hữu không
    const canEdit = detail?.owner?.id.toString() === myId;

    // --- MODAL CONTROL ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTrackOptions, setShowTrackOptions] = useState(false);

    // --- EDIT LOGIC STATES ---
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [selectedImage, setSelectedImage] = useState<any | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- SEARCH/TRACK STATES ---
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<TrackContentType[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<any | null>(null);

    const [inviteKeyword, setInviteKeyword] = useState('');
    const [inviteResults, setInviteResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const loadDetail = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            // 1. Lấy My ID từ bộ nhớ
            const storedId = await AsyncStorage.getItem('userId');
            setMyId(storedId);

            // 2. Lấy dữ liệu Playlist
            const res = await getPlayListDetailAPI(Number(id));
            setDetail(res);
            setEditName(res.title || '');
            setEditDesc(res.description || '');
            setIsPublic(true);
            if (res?.tracks) setExistedTrackIds(res.tracks.map((t: any) => t.id));
        } catch (error) {
            console.error("Lỗi tải playlist:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    // --- LOGIC XỬ LÝ COLLAB ---
    const handleManageCollab = (collab: any) => {
        if (!canEdit) return; // Bảo vệ logic
        Alert.alert("Quản lý cộng tác viên", `Bạn muốn làm gì với ${collab.fullName || collab.name}?`, [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa khỏi Playlist", style: "destructive", onPress: () => console.log("Xóa collab:", collab.id) }
        ]);
    };

    // --- LOGIC CHỈNH SỬA & UPLOAD ---
    const handleSelectImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
        if (!result.canceled) {
            const asset = result.assets[0];
            setSelectedImage({ uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || `playlist_${id}.jpg` });
        }
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return Alert.alert("Lỗi", "Vui lòng nhập tên");
        try {
            setIsUpdating(true);
            let finalThumbnailKey = detail?.thumbnailUrl || '';
            if (selectedImage) {
                const uploadInfo = await getPresignedUploadUrl(selectedImage.name, selectedImage.type, "thumbnails");
                const success = await uploadFileToMinIO(selectedImage.uri, selectedImage.type, uploadInfo.url);
                if (success) finalThumbnailKey = uploadInfo.key;
            }
            await updatePlayListAPI(Number(id), editName.trim(), editDesc.trim(), finalThumbnailKey, isPublic);
            setShowEditModal(false);
            loadDetail();
        } catch (e) { Alert.alert("Lỗi lưu"); } finally { setIsUpdating(false); }
    };

    const handleDeletePlaylist = async () => {
        Alert.alert("Xác nhận", "Xóa toàn bộ playlist này?", [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: async () => {
                router.replace('/profile');
            }}
        ]);
    };

    // --- LOGIC BÀI HÁT ---
    const handleRemoveTrack = async () => {
        if (!selectedTrack || !id) return;
        try {
            await removeTrackFromPlayListAPI([Number(id)], selectedTrack.id);
            setShowTrackOptions(false);
            loadDetail();
        } catch (e) { Alert.alert("Lỗi xóa bài"); }
    };

    const handleAddTrack = async (trackId: number) => {
        try {
            await addTrackToPlayListAPI([Number(id)], trackId);
            loadDetail();
        } catch (e) { Alert.alert("Lỗi thêm bài"); }
    };

    useEffect(() => {
        if (!searchKeyword.trim()) { setSearchResults([]); return; }
        const delayDebounce = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await searchTrackToAddAPI({ existedTrackIds, keyword: searchKeyword, pageNumber: 1, pageSize: 15 });
                setSearchResults(res || []);
            } catch (e) { console.error(e); } finally { setSearchLoading(false); }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchKeyword, existedTrackIds]);

    useEffect(() => {
    if (!inviteKeyword.trim()) {
        setInviteResults([]);
        return;
    }
    const delayDebounce = setTimeout(async () => {
        setIsSearching(true);
        try {
            const res = await searchAPI({ keyword: inviteKeyword, type: 'members', pageNumber: 1, pageSize: 20 });
            // Lọc: Chỉ lấy những người có friendStatus là ACCEPTED
            const onlyAccepted = res.memberPreviewDTOS?.content.filter((u: any) => u.friendStatus === 'ACCEPTED') || [];
            setInviteResults(onlyAccepted);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    }, 500);
    return () => clearTimeout(delayDebounce);
}, [inviteKeyword]);

    if (loading) return <View style={styles.centered}><ActivityIndicator color={Colors.teal} size="large" /></View>;
    if (!detail) return null;

    const allMembers = [detail.owner, ...(detail.collaborators || [])].filter(Boolean);

    const handleAddCollaborator = async (userId: number) => {
        if (!id) return;
        try {
            await addCollaboratorToPlayListAPI(Number(id), [userId]);
            loadDetail();
        } catch (e) { Alert.alert("Lỗi thêm cộng tác viên"); }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER BACK */}
            <View style={[styles.headerFixed, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* --- LIST NỘI DUNG CHÍNH --- */}
            <Animated.FlatList
                data={detail.tracks}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 20, paddingBottom: 150 }}
                ListHeaderComponent={
                    <View style={styles.headerContainer}>
                        <View style={styles.coverWrapper}>
                            {detail.thumbnailUrl ? <Image source={{ uri: detail.thumbnailUrl }} style={styles.coverImg} /> : <View style={styles.coverPlaceholder}><Ionicons name="musical-notes" size={60} color="#444" /></View>}
                        </View>

                        <View style={styles.titleRow}>
                            <Text style={styles.titleText}>{detail.title}</Text>
                            {/* 1. Ẩn nút Pencil nếu không có quyền */}
                            {canEdit && (
                                <TouchableOpacity onPress={() => setShowEditModal(true)}>
                                    <Ionicons name="pencil-outline" size={20} color="#AAA" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.collabRow}>
                            <View style={styles.avatarStack}>
                                {allMembers.slice(0, 3).map((m: any, i) => (
                                    <View key={m.id} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
                                        <Image source={{ uri: m.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.fullImg} />
                                    </View>
                                ))}
                                {/* 2. Ẩn nút thêm Collab nếu không có quyền */}
                                {canEdit && (
                                    <TouchableOpacity style={[styles.miniAvatar, styles.addBtnSmall]} onPress={() => setShowInviteModal(true)}>
                                        <Ionicons name="add" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.ownerLabel}>{detail.owner?.name}</Text>
                        </View>

                        {/* 3. Chỉ hiện hàng nút ADD/EDIT nếu có quyền */}
                        <View style={styles.actionRow}>
                            <View style={styles.leftActions}>
                                {canEdit ? (
                                    <>
                                        <TouchableOpacity style={styles.btnOutline} onPress={() => setShowSearchModal(true)}>
                                            <Text style={styles.btnText}>+ ADD</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.btnOutline} onPress={() => setShowEditModal(true)}>
                                            <Text style={styles.btnText}>≡ EDIT</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={styles.viewOnlyBadge}>
                                        <Text style={styles.viewOnlyText}>PUBLIC PLAYLIST</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.rightActions}>
                                <Ionicons name="shuffle" size={28} color="#FFF" style={{ marginRight: 15 }} />
                                <TouchableOpacity style={styles.playBtnLarge}><Ionicons name="play" size={28} color="#000" /></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.trackItem} onPress={() => setCurrentTrack({ ...item, trackUrl: (item as any).trackUrl })}>
                        <Image source={{ uri: item.thumbnailUrl }} style={styles.trackThumb} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.trackArtist}>{(item as any).contributors?.[0]?.name || 'Unknown'}</Text>
                        </View>
                        {/* 4. Ẩn dấu ba chấm (Xóa bài) nếu không có quyền */}
                        {canEdit && (
                            <TouchableOpacity style={{ padding: 5 }} onPress={() => { setSelectedTrack(item); setShowTrackOptions(true); }}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
            />

            {/* --- MODAL EDIT (Vẫn giữ để app không lỗi, nhưng user thường sẽ không mở được) --- */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowEditModal(false)} />
                    <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalTopBar}>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                            <Text style={styles.modalMainTitle}>Name and description</Text>
                            <TouchableOpacity onPress={handleSaveEdit} disabled={isUpdating}>{isUpdating ? <ActivityIndicator size="small" color={Colors.teal} /> : <Text style={styles.modalSaveText}>Save</Text>}</TouchableOpacity>
                        </View>
                        <View style={styles.modalForm}>
                            <TouchableOpacity style={styles.modalImageSquare} onPress={handleSelectImage}>
                                {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.fullImg} /> : detail.thumbnailUrl ? <Image source={{ uri: detail.thumbnailUrl }} style={styles.fullImg} /> : <Ionicons name="image-outline" size={40} color="#888" />}
                            </TouchableOpacity>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="Playlist name" placeholderTextColor="#000" />
                                <Text style={styles.inputLabelHint}>EDIT NAME</Text>
                            </View>
                        </View>
                        <TextInput style={styles.descInput} value={editDesc} onChangeText={setEditDesc} placeholder="Add a description..." placeholderTextColor="#AAA" multiline textAlignVertical="top" />
                        <View style={styles.modalDivider} />
                        <TouchableOpacity style={styles.modalActionItem} onPress={() => setIsPublic(!isPublic)}><Ionicons name={isPublic ? "lock-open-outline" : "lock-closed-outline"} size={22} color="#FFF" /><Text style={styles.modalActionText}>{isPublic ? 'SET TO PRIVATE' : 'SET TO PUBLIC'}</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.modalActionItem} onPress={handleDeletePlaylist}><Ionicons name="trash-outline" size={22} color="#FF4444" /><Text style={[styles.modalActionText, { color: '#FF4444' }]}>DELETE</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* --- MODAL COLLAB (Chỉ xem nếu không có quyền) --- */}
            <Modal visible={showInviteModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => {
            setShowInviteModal(false);
            setInviteKeyword(''); // Reset khi đóng
        }} />
        <View style={[styles.inviteSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {/* DANH SÁCH COLLAB HIỆN TẠI */}
            <View style={styles.collabList}>
                <View style={styles.userRowItem}>
                    <View style={styles.userAvatarPlaceholder}>
                        {detail.owner?.avatarUrl ? <Image source={{uri: detail.owner.avatarUrl}} style={styles.fullImgRound} /> : <Ionicons name="person" size={20} color="#666" />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userNameText}>{detail.owner?.name}</Text>
                        <Text style={styles.userRoleLabel}>Owner</Text>
                    </View>
                </View>

                {detail.collaborators?.map((c: any) => (
                    <View key={c.id} style={styles.userRowItem}>
                        <View style={styles.userAvatarPlaceholder}>
                            {c.avatarUrl ? <Image source={{uri: c.avatarUrl}} style={styles.fullImgRound} /> : <Ionicons name="person" size={20} color="#666" />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userNameText}>{c.name}</Text>
                            <TouchableOpacity 
                                style={styles.roleSelector} 
                                onPress={() => canEdit && handleManageCollab(c)}
                                disabled={!canEdit}
                            >
                                <Text style={styles.userRoleLabel}>Collabs</Text>
                                {canEdit && <Ionicons name="chevron-down" size={12} color="#888" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>

            {/* PHẦN SEARCH & INVITE (CHỈ CHO OWNER) */}
            {canEdit && (
                <>
                    <View style={styles.horizontalDivider} />
                    
                    {/* Header kèm ô Search */}
                    <View style={styles.inviteHeaderRow}>
                        <Text style={styles.inviteSectionTitle}>Invite friends</Text>
                        <View style={styles.searchBoxSmall}>
                            <Ionicons name="search" size={14} color="#888" />
                            <TextInput 
                                style={styles.searchBoxInput}
                                placeholder="Search accepted friends..."
                                placeholderTextColor="#555"
                                value={inviteKeyword}
                                onChangeText={setInviteKeyword}
                            />
                            {isSearching && <ActivityIndicator size="small" color={Colors.teal} />}
                        </View>
                    </View>

                    <FlatList 
                        horizontal 
                        data={inviteResults} 
                        keyExtractor={(item) => item.id.toString()} 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.horizontalListContent}
                        ListEmptyComponent={
                            <Text style={styles.emptySearchText}>
                                {inviteKeyword ? "No accepted friends found" : "Enter name to search"}
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.inviteFriendCard}>
                                <View style={styles.friendAvatarCircle}>
                                    {item.avatarUrl ? (
                                        <Image source={{uri: item.avatarUrl}} style={styles.fullImgRound} />
                                    ) : (
                                        <View style={styles.friendAvatarInner} />
                                    )}
                                </View>
                                <Text style={styles.friendCardName} numberOfLines={1}>{item.name}</Text>
                                <TouchableOpacity 
                                    style={styles.inviteActionBtn}
                                    onPress={() => handleAddCollaborator(item.id)}
                                >
                                    <Ionicons name="person-add" size={14} color="#FFF" />
                                    <Text style={styles.inviteActionText}>Invite</Text>
                                </TouchableOpacity>
                            </View>
                        )} 
                    />
                </>
            )}
        </View>
    </View>
</Modal>

            {/* --- CÁC MODAL SEARCH & OPTIONS --- */}
            <Modal visible={showSearchModal} animationType="slide" transparent>
                <View style={styles.fullModal}>
                    <View style={[styles.searchBarHeader, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => setShowSearchModal(false)}><Ionicons name="chevron-down" size={28} color="#FFF" /></TouchableOpacity>
                        <View style={styles.searchInner}><Ionicons name="search" size={18} color="#888" /><TextInput style={styles.searchInput} placeholder="Search tracks..." placeholderTextColor="#888" value={searchKeyword} onChangeText={setSearchKeyword} autoFocus /></View>
                    </View>
                    <FlatList data={searchResults} keyExtractor={(item) => `search-${item.id}`} renderItem={({ item }) => (
                        <View style={styles.searchItem}><Image source={{ uri: item.thumbnailUrl }} style={styles.searchThumb} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.searchTitle}>{item.title}</Text></View><TouchableOpacity onPress={() => handleAddTrack(item.id)}><Ionicons name="add-circle" size={30} color={Colors.teal} /></TouchableOpacity></View>
                    )} contentContainerStyle={{ padding: 20 }} />
                </View>
            </Modal>

            <Modal visible={showTrackOptions} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTrackOptions(false)}>
                    <View style={styles.trackOptionsSheet}>
                        <View style={styles.modalHandle} />
                        {selectedTrack && (
                            <View style={styles.trackInfoPreview}><Image source={{ uri: selectedTrack.thumbnailUrl }} style={styles.previewThumb} /><View><Text style={styles.previewTitle}>{selectedTrack.title}</Text><Text style={styles.previewSub}>Remove this track from playlist</Text></View></View>
                        )}
                        <TouchableOpacity style={styles.deleteOptionBtn} onPress={handleRemoveTrack}><Ionicons name="trash-outline" size={24} color="#FF4444" /><Text style={styles.deleteOptionText}>Remove from this playlist</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    headerFixed: { position: 'absolute', zIndex: 10, left: 15, height: 60, justifyContent: 'center' },
    backIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { alignItems: 'flex-start', marginBottom: 20 },
    coverWrapper: { width: width * 0.55, height: width * 0.55, borderRadius: 20, backgroundColor: '#222', alignSelf: 'center', marginTop: 40, overflow: 'hidden', elevation: 5 },
    coverImg: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
    titleText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    collabRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    avatarStack: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
    miniAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#000', overflow: 'hidden' },
    fullImg: { width: '100%', height: '100%' },
    addBtnSmall: { backgroundColor: '#333', marginLeft: -10, justifyContent: 'center', alignItems: 'center' },
    ownerLabel: { color: '#888', fontSize: 14, fontWeight: '600' },
    actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
    leftActions: { flexDirection: 'row', gap: 8 },
    btnOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1A1A1A' },
    btnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    // Badge cho "Other profile"
    viewOnlyBadge: { backgroundColor: '#0F2D24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: Colors.teal },
    viewOnlyText: { color: Colors.teal, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    rightActions: { flexDirection: 'row', alignItems: 'center' },
    playBtnLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
    trackItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
    trackThumb: { width: 48, height: 48, borderRadius: 4, backgroundColor: '#111' },
    trackTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
    trackArtist: { color: '#888', fontSize: 12, marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#2C2C2C', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalCancelText: { color: '#AAA', fontSize: 15 },
    modalMainTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    modalSaveText: { color: Colors.teal, fontSize: 15, fontWeight: '800' },
    modalForm: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    modalImageSquare: { width: 100, height: 100, backgroundColor: '#D9D9D9', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    modalInput: { backgroundColor: '#777', height: 42, borderRadius: 8, paddingHorizontal: 12, color: '#000', fontWeight: '700', fontSize: 15 },
    inputLabelHint: { color: '#888', fontSize: 11, marginTop: 5, paddingLeft: 5 },
    descInput: { backgroundColor: '#111', borderRadius: 12, padding: 15, color: '#FFF', height: 80, fontSize: 14, marginBottom: 20 },
    modalDivider: { height: 1, backgroundColor: '#3D3D3D', marginBottom: 15 },
    modalActionItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15 },
    modalActionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    inviteSheet: { backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10 },
    collabList: { marginVertical: 15, gap: 18 },
    userRowItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    userAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D9D9D9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    userNameText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    userRoleLabel: { color: '#888', fontSize: 13 },
    roleSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    horizontalDivider: { height: 1, backgroundColor: '#222', marginVertical: 15 },
    inviteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    inviteSectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    horizontalListContent: { gap: 12, paddingBottom: 10 },
    inviteFriendCard: { backgroundColor: '#EAEAEA', width: 130, borderRadius: 18, padding: 12, alignItems: 'center' },
    friendAvatarCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    friendAvatarInner: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#CCC' },
    friendCardName: { color: '#000', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    inviteActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#999', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
    inviteActionText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    trackOptionsSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
    trackInfoPreview: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    previewThumb: { width: 45, height: 45, borderRadius: 5 },
    previewTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    previewSub: { color: '#888', fontSize: 12 },
    deleteOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 10 },
    deleteOptionText: { color: '#FF4444', fontSize: 16, fontWeight: '600' },
    fullModal: { flex: 1, backgroundColor: '#000' },
    searchBarHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
    searchInner: { flex: 1, height: 40, backgroundColor: '#1A1A1A', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
    searchInput: { flex: 1, color: '#FFF' },
    searchItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    searchThumb: { width: 50, height: 50, borderRadius: 4 },
    searchTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
    searchBoxSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 34,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#333'
},
searchBoxInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    marginLeft: 5,
    paddingVertical: 0
},
emptySearchText: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 15,
    marginLeft: 5
},
fullImgRound: {
    width: '100%',
    height: '100%',
    borderRadius: 25 // Tùy chỉnh theo kích thước placeholder
}
});