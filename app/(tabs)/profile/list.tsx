import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import {
    PlayListDetail,
    addTrackToPlayListAPI,
    // deletePlayListAPI,
    getPlayListDetailAPI,
    removeTrackFromPlayListAPI,
    searchTrackToAddAPI,
    updatePlayListAPI
} from '@/services/listService';
import { TrackContentType } from '@/services/searchService';
import { getPresignedUploadUrl, uploadFileToMinIO } from '@/services/storageService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PlaylistDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const { setCurrentTrack, currentTrack } = useCurrentTrack()!;

    // --- STATES DỮ LIỆU ---
    const [detail, setDetail] = useState<PlayListDetail | null>(null);
    const [existedTrackIds, setExistedTrackIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // --- STATES EDIT PLAYLIST ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [selectedImage, setSelectedImage] = useState<any | null>(null); 
    const [isPublic, setIsPublic] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- STATES SEARCH & ADD TRACK ---
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<TrackContentType[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // --- STATES TRACK OPTIONS (XÓA TRACK) ---
    const [showTrackOptions, setShowTrackOptions] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<any | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    // --- FETCH DATA & RESET ---
    const loadDetail = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setSelectedImage(null);
            setSearchResults([]);
            setSearchKeyword('');
            
            const res = await getPlayListDetailAPI(Number(id));
            setDetail(res);
            
            // Cập nhật ngay danh sách ID hiện có để truyền vào Search
            if (res && res.tracks) {
                setExistedTrackIds(res.tracks.map((t: any) => t.id));
            }
            
            setEditName(res.title || '');
            setEditDesc(res.description || '');
        } catch (error) {
            console.error("Lỗi tải playlist:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    // --- XỬ LÝ SEARCH (TRUYỀN existedTrackIds) ---
    useEffect(() => {
        if (!searchKeyword.trim()) { setSearchResults([]); return; }
        const delayDebounce = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await searchTrackToAddAPI({ 
                    existingTrackIds: existedTrackIds, 
                    keyword: searchKeyword, 
                    pageNumber: 1, 
                    pageSize: 15 
                });
                setSearchResults(res || []);
            } catch (e) { console.error(e); } finally { setSearchLoading(false); }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchKeyword, existedTrackIds]);

    const handleAddTrack = async (trackId: number) => {
        try {
            await addTrackToPlayListAPI([Number(id)], trackId);
            Alert.alert("Thành công", "Đã thêm vào playlist!");
            loadDetail(); // Tải lại để cập nhật list bài hát và existedTrackIds
        } catch (error) { Alert.alert("Lỗi", "Không thể thêm bài hát này."); }
    };

    const handleRemoveTrack = async () => {
        if (!selectedTrack || !id) return;
        Alert.alert("Xác nhận", `Xóa "${selectedTrack.title}"?`, [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: async () => {
                try {
                    await removeTrackFromPlayListAPI([Number(id)], selectedTrack.id);
                    setShowTrackOptions(false);
                    loadDetail();
                } catch (e) { Alert.alert("Lỗi xóa bài hát"); }
            }}
        ]);
    };

    // const handleDeletePlaylist = async () => {
    //     Alert.alert("Xóa Playlist", "Hành động này không thể hoàn tác!", [
    //         { text: "Hủy", style: "cancel" },
    //         { text: "Xóa", style: "destructive", onPress: async () => {
    //             try {
    //                 await deletePlayListAPI(Number(id));
    //                 setShowEditModal(false);
    //                 router.replace('/profile');
    //             } catch (e) { Alert.alert("Lỗi xóa danh sách"); }
    //         }}
    //     ]);
    // };

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
        } catch (e) { Alert.alert("Lỗi lưu thay đổi"); } finally { setIsUpdating(false); }
    };

    const handleSelectImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
        if (!result.canceled) {
            const asset = result.assets[0];
            setSelectedImage({ uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || `playlist_${id}.jpg` });
        }
    };

    // --- ANIMATIONS ---
    const headerTitleOpacity = scrollY.interpolate({ inputRange: [140, 200], outputRange: [0, 1], extrapolate: 'clamp' });
    const headerBgOpacity = scrollY.interpolate({ inputRange: [100, 180], outputRange: [0, 1], extrapolate: 'clamp' });

    if (loading) return <View style={styles.centered}><ActivityIndicator color={Colors.teal} size="large" /></View>;
    if (!detail) return null;

    const allMembers = [detail.owner, ...(detail.collaborators || [])].flat();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <Animated.View style={[styles.headerBg, { height: insets.top + 60, opacity: headerBgOpacity }]} />
            <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
                <Animated.View style={{ opacity: headerTitleOpacity, flex: 1, alignItems: 'center' }}><Text style={styles.headerTitleText} numberOfLines={1}>{detail.title}</Text></Animated.View>
                <TouchableOpacity style={styles.backBtn}><Ionicons name="share-social-outline" size={22} color="#FFF" /></TouchableOpacity>
            </View>

            <Animated.FlatList
                data={detail.tracks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const isActive = currentTrack?.id === item.id;
                    return (
                        <TouchableOpacity style={styles.songItem} activeOpacity={0.7} onPress={() => setCurrentTrack({...item, trackUrl: (item as any).trackUrl})}>
                            <View style={styles.songThumbnail}>
                                {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={styles.fullImg} /> : <View style={styles.songPlaceholder} />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.songTitle, isActive && { color: Colors.teal }]} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.songArtist} numberOfLines={1}>
                                    {(item as any).contributors?.map((c: any) => c.name).join(', ') || 'Nghệ sĩ'} • {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                                </Text>
                            </View>
                            <TouchableOpacity style={{ padding: 10 }} onPress={() => { setSelectedTrack(item); setShowTrackOptions(true); }}>
                                <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 110, paddingBottom: 150 }}
                ListHeaderComponent={
                    <View style={styles.topSection}>
                        <View style={[styles.mainCover, !detail.thumbnailUrl && { backgroundColor: Colors.teal }]}>
                            {detail.thumbnailUrl ? <Image source={{ uri: detail.thumbnailUrl }} style={styles.fullImg} /> : <Ionicons name="disc-outline" size={80} color="#FFF" opacity={0.5} />}
                        </View>
                        <View style={styles.titleRow}>
                            <Text style={styles.playlistTitleLarge}>{detail.title}</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(true)}><Ionicons name="pencil-outline" size={22} color="#FFF" /></TouchableOpacity>
                        </View>
                        <View style={styles.ownerRow}>
                            <View style={styles.avatarStack}>
                                {allMembers.slice(0, 3).map((m, i) => (
                                    <View key={m.id} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i, backgroundColor: '#333' }]}>
                                        {m.avatarUrl ? <Image source={{ uri: m.avatarUrl }} style={styles.fullImgRound} /> : <Ionicons name="person" size={10} color="#888" />}
                                    </View>
                                ))}
                            </View>
                           {/* <Text style={styles.ownerName}>{detail.owner[0]?.displayName || detail.owner[0]?.name || 'Bien'}</Text> */}
                        </View>
                        <View style={styles.actionButtonRow}>
                            <View style={styles.leftActions}>
                                <TouchableOpacity style={styles.smallActionBtn} onPress={() => setShowSearchModal(true)}><Text style={styles.smallActionText}>+ ADD</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.smallActionBtn} onPress={() => setShowEditModal(true)}><Text style={styles.smallActionText}>≡ EDIT</Text></TouchableOpacity>
                            </View>
                            <View style={styles.rightActions}>
                                <Ionicons name="shuffle" size={28} color="#FFF" />
                                <TouchableOpacity style={styles.playBtnCircle}><Ionicons name="play" size={30} color="#000" /></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                }
            />

            {/* MODAL OPTIONS (XÓA TRACK) */}
            <Modal visible={showTrackOptions} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTrackOptions(false)}>
                    <View style={styles.trackOptionsSheet}>
                        <View style={styles.modalHandle} />
                        {selectedTrack && (
                            <View style={styles.trackInfoPreview}>
                                <Image source={{ uri: selectedTrack.thumbnailUrl }} style={styles.previewThumb} />
                                <View><Text style={styles.previewTitle}>{selectedTrack.title}</Text><Text style={styles.previewSub}>Remove this track from playlist</Text></View>
                            </View>
                        )}
                        <TouchableOpacity style={styles.deleteOptionBtn} onPress={handleRemoveTrack}>
                            <Ionicons name="trash-outline" size={24} color="#FF4444" />
                            <Text style={styles.deleteOptionText}>Remove from this playlist</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* MODAL SEARCH */}
            <Modal visible={showSearchModal} animationType="slide" transparent>
                <View style={styles.fullModalOverlay}>
                    <View style={[styles.fullModalContent, { paddingTop: insets.top + 10 }]}>
                        <View style={styles.searchHeader}>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)}><Ionicons name="chevron-down" size={30} color="#FFF" /></TouchableOpacity>
                            <View style={styles.searchBarInner}>
                                <Ionicons name="search" size={18} color="#888" />
                                <TextInput style={styles.searchInput} placeholder="Search songs to add..." placeholderTextColor="#888" value={searchKeyword} onChangeText={setSearchKeyword} autoFocus />
                                {searchLoading && <ActivityIndicator size="small" color={Colors.teal} />}
                            </View>
                        </View>
                        <FlatList data={searchResults} keyExtractor={(item) => `search-${item.id}`} renderItem={({ item }) => (
                            <View style={styles.searchResultItem}>
                                <Image source={{ uri: item.thumbnailUrl }} style={styles.searchThumb} />
                                <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.searchTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.searchArtist}>{item.contributors?.[0]?.name || 'Artist'}</Text></View>
                                <TouchableOpacity onPress={() => handleAddTrack(item.id)}><Ionicons name="add-circle" size={32} color={Colors.teal} /></TouchableOpacity>
                            </View>
                        )} />
                    </View>
                </View>
            </Modal>

            {/* MODAL EDIT (MOCKUP XÁM) */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowEditModal(false)} />
                    <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalTopBar}>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                            <Text style={styles.modalMainTitle}>Name and description</Text>
                            <TouchableOpacity onPress={handleSaveEdit} disabled={isUpdating}>{isUpdating ? <ActivityIndicator size="small" /> : <Text style={styles.modalSaveText}>Save</Text>}</TouchableOpacity>
                        </View>
                        <View style={styles.modalForm}>
                            <TouchableOpacity style={styles.modalImageSquare} onPress={handleSelectImage}>
                                {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.fullImg} /> : detail.thumbnailUrl ? <Image source={{ uri: detail.thumbnailUrl }} style={styles.fullImg} /> : <Ionicons name="image-outline" size={40} color="#888" />}
                            </TouchableOpacity>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="Playlist name" placeholderTextColor="#000" />
                                <Text style={{ color: '#888', fontSize: 11, marginTop: 5, paddingLeft: 5 }}>EDIT NAME</Text>
                            </View>
                        </View>
                        <TextInput style={styles.descInput} value={editDesc} onChangeText={setEditDesc} placeholder="Add description..." placeholderTextColor="#AAA" multiline textAlignVertical="top" />
                        <View style={styles.modalDivider} />
                        <TouchableOpacity style={styles.modalActionItem} onPress={() => setIsPublic(!isPublic)}><Ionicons name={isPublic ? "lock-open-outline" : "lock-closed-outline"} size={22} color="#FFF" /><Text style={styles.modalActionText}>{isPublic ? 'SET TO PRIVATE' : 'SET TO PUBLIC'}</Text></TouchableOpacity>
                        {/* <TouchableOpacity style={styles.modalActionItem} onPress={handleDeletePlaylist}><Ionicons name="trash-outline" size={22} color="#FF4444" /><Text style={[styles.modalActionText, { color: '#FF4444' }]}>DELETE</Text></TouchableOpacity> */}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    headerBg: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#000' },
    headerContent: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 11, flexDirection: 'row', paddingHorizontal: 15, height: 100, alignItems: 'center' },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitleText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    topSection: { marginBottom: 30 },
    mainCover: { width: 220, height: 220, borderRadius: 25, alignSelf: 'center', marginBottom: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: '100%', height: '100%' },
    fullImgRound: { width: '100%', height: '100%', borderRadius: 15 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    playlistTitleLarge: { color: '#FFF', fontSize: 32, fontWeight: '900' },
    ownerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarStack: { flexDirection: 'row', marginRight: 10 },
    miniAvatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#000', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    ownerName: { color: '#888', fontSize: 16, fontWeight: '700' },
    actionButtonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leftActions: { flexDirection: 'row', gap: 10 },
    rightActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    smallActionBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    smallActionText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    playBtnCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
    songItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12 },
    songThumbnail: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#111' },
    songPlaceholder: { flex: 1, backgroundColor: '#333', borderRadius: 6 },
    songTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    songArtist: { color: '#666', fontSize: 13 },
    trackOptionsSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, position: 'absolute', bottom: 0, width: '100%' },
    trackInfoPreview: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    previewThumb: { width: 45, height: 45, borderRadius: 5 },
    previewTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    previewSub: { color: '#888', fontSize: 12 },
    deleteOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 10 },
    deleteOptionText: { color: '#FF4444', fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#2C2C2C', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 20 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalCancelText: { color: '#AAA', fontSize: 15 },
    modalMainTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    modalSaveText: { color: Colors.teal, fontSize: 15, fontWeight: '800' },
    modalForm: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    modalImageSquare: { width: 100, height: 100, backgroundColor: '#D9D9D9', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    modalInput: { backgroundColor: '#777', height: 42, borderRadius: 8, paddingHorizontal: 12, color: '#000', fontWeight: '700', fontSize: 15 },
    descInput: { backgroundColor: '#111', borderRadius: 12, padding: 15, color: '#FFF', height: 80, fontSize: 14, marginBottom: 20 },
    modalDivider: { height: 1, backgroundColor: '#3D3D3D', marginBottom: 15 },
    modalActionItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15 },
    modalActionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    fullModalOverlay: { flex: 1, backgroundColor: '#000' },
    fullModalContent: { flex: 1 },
    searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 10 },
    searchBarInner: { flex: 1, height: 45, backgroundColor: '#1A1A1A', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    searchThumb: { width: 55, height: 55, borderRadius: 8 },
    searchTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    searchArtist: { color: '#888', fontSize: 13 },
});
