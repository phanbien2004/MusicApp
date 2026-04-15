import { Colors } from "@/constants/theme";
import { useCurrentTrack } from "@/context/currentTrack-context";
import { usePlayer } from "@/context/player-context";
import { AlbumDetail, getAlbumDetailAPI, addTrackToAlbumAPI, removeTrackFromAlbumAPI } from "@/services/albumService";
import { searchAPI, TrackContentType } from "@/services/searchService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const getTrackArtistLabel = (track?: TrackContentType | null) => {
  const contributorNames =
    track?.contributors?.map((contributor) => contributor.name).filter(Boolean) ||
    [];

  return contributorNames.length > 0
    ? contributorNames.join(", ")
    : "Unknown Artist";
};

export default function AlbumDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    thumbnailUrl?: string;
    releaseYear?: string;
    artistName?: string;
    isOwner?: string;
  }>();
  const albumId = Number(params.id);
  const isOwnerMode = params.isOwner === 'true';

  // --- AUDIO CONTEXT & STATUS ---
  const { currentTrack, setCurrentTrack, player } = useCurrentTrack()!;
  const status = useAudioPlayerStatus(player);
  const { lastActiveTab } = usePlayer();

  // --- DATA STATES ---
  const [detail, setDetail] = useState<AlbumDetail | null>(() => {
    if (!albumId || !Number.isFinite(albumId)) {
      return null;
    }

    return {
      id: albumId,
      title: params.title || "",
      thumbnailUrl: params.thumbnailUrl || "",
      releaseYear: params.releaseYear ? Number(params.releaseYear) : undefined,
      artistName: params.artistName || "",
      tracks: [],
    };
  });
  const [loading, setLoading] = useState(true);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // --- MODAL STATES ---
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<TrackContentType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [showTrackOptions, setShowTrackOptions] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackContentType | null>(null);

  const loadDetail = useCallback(async () => {
    if (!albumId || !Number.isFinite(albumId)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const storedAlbumId = await AsyncStorage.getItem("currentAlbumId");
      setActivePlaylistId(storedAlbumId);

      const tracks = await getAlbumDetailAPI(albumId);
      setDetail((prev) => ({
        id: prev?.id || albumId,
        title: prev?.title || params.title || "",
        thumbnailUrl:
          prev?.thumbnailUrl ||
          params.thumbnailUrl ||
          tracks[0]?.thumbnailUrl ||
          "",
        releaseYear: prev?.releaseYear,
        artistName:
          prev?.artistName || params.artistName || getTrackArtistLabel(tracks[0]),
        tracks,
      }));
    } catch (error) {
      console.error("Lỗi tải album:", error);
    } finally {
      setLoading(false);
    }
  }, [albumId, params.artistName, params.thumbnailUrl, params.title]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail]),
  );

  // --- SEARCH EFFECT FOR OWNER ---
  useEffect(() => {
    if (!isOwnerMode) return;
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchAPI({ keyword: searchKeyword, type: "tracks", pageNumber: 1, pageSize: 50 });
        const globalTracks = res.trackPreviewDTOS?.content || [];
        
        // Chỉ lấy những track có tên bạn đóng góp
        const myTracks = globalTracks.filter(track => 
            track.contributors?.some((c: any) => c.name === params.artistName)
        );

        // Loại bỏ các track đã có trong Album
        const existedIds = detail?.tracks?.map(t => t.id) || [];
        setSearchResults(myTracks.filter(t => !existedIds.includes(t.id)));

      } catch (e) { 
        console.error("Search failed: ", e); 
      } finally { 
        setSearchLoading(false); 
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchKeyword, isOwnerMode, detail?.tracks, params.artistName]);

  // --- ACTION LOGIC FOR OWNER ---
  const handleRemoveTrack = async () => {
    if (!selectedTrack || !albumId) return;
    try {
      await removeTrackFromAlbumAPI(albumId, selectedTrack.id);
      setShowTrackOptions(false);
      loadDetail(); // Reload list
    } catch (err) {
      Alert.alert("Error", "Could not remove track.");
    }
  };

  const handleAddTrack = async (trackId: number) => {
    if (!albumId) return;
    try {
      const position = detail?.tracks?.length ? detail.tracks.length + 1 : 1;
      await addTrackToAlbumAPI(albumId, trackId, position);
      setShowSearchModal(false);
      setSearchKeyword("");
      loadDetail(); // Reload list
    } catch (err) {
      Alert.alert("Error", "Could not add track.");
    }
  };

  // --- LOGIC PHÁT NHẠC ---
  const handleTogglePlayAlbum = async () => {
    if (!detail?.tracks?.length) return;

    if (status.playing && activePlaylistId === detail.id.toString()) {
      player.pause();
    } else {
      const firstTrack = {
        ...detail.tracks[0],
        trackUrl: (detail.tracks[0] as any).trackUrl,
      };
      await AsyncStorage.setItem("currentAlbumId", detail.id.toString());
      setActivePlaylistId(detail.id.toString());
      await setCurrentTrack(firstTrack, false, {
        source: "album",
        albumId: detail.id,
      });
    }
  };

  const handleTrackSelect = async (item: any) => {
    await AsyncStorage.setItem("currentAlbumId", detail!.id.toString());
    setActivePlaylistId(detail!.id.toString());
    await setCurrentTrack({ ...item, trackUrl: (item as any).trackUrl }, false, {
      source: "album",
      albumId: detail!.id,
    });
  };

  if (loading && !detail)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );

  if (!detail)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#FFF" }}>Không tìm thấy Album</Text>
      </View>
    );

  const isPlayingAlbum =
    status.playing && activePlaylistId === detail.id.toString();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER TĨNH NẰM NGOÀI FLATLIST ĐỂ LUÔN HIỂN THỊ TRÊN CÙNG */}
      <View style={[styles.headerFixed, { top: insets.top || 10 }]}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => {
            const tab = lastActiveTab || "album";
            router.navigate(`/(tabs)/${tab}` as any);
          }}
        >
          <Ionicons name="chevron-back" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={detail.tracks}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 120, // Chừa khoảng trống cho thanh Player
          paddingHorizontal: 20,
        }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.coverWrapper}>
              <Image source={{ uri: detail.thumbnailUrl }} style={styles.coverImg} />
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titleText}>{detail.title}</Text>
                <Text style={styles.artistLabel}>
                  {detail.artistName || "Unknown Artist"}
                </Text>
              </View>
              {isOwnerMode && (
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowSearchModal(true)}>
                    <Ionicons name="add-circle-outline" size={28} color="#FFF" />
                  </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionRow}>
              <View style={styles.leftActions}>
                <Text style={styles.songCountText}>
                  {detail.tracks?.length || 0} Songs
                </Text>
              </View>

              <View style={styles.rightActions}>
                <Ionicons
                  name="shuffle"
                  size={28}
                  color="#FFF"
                  style={{ marginRight: 15 }}
                />
                <TouchableOpacity
                  style={styles.playBtnLarge}
                  onPress={handleTogglePlayAlbum}
                >
                  <Ionicons
                    name={isPlayingAlbum ? "pause" : "play"}
                    size={28}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isTrackPlayingHere =
            currentTrack?.id === item.id &&
            activePlaylistId === detail.id.toString();

          return (
            <TouchableOpacity
              style={[
                styles.trackItem,
                isTrackPlayingHere && styles.trackItemActive,
              ]}
              onPress={() => handleTrackSelect(item)}
            >
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.trackThumb}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.trackTitle,
                    isTrackPlayingHere && { color: Colors.teal },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.trackArtist}>
                  {getTrackArtistLabel(item) || detail.artistName || "Unknown"}
                </Text>
              </View>

              {isTrackPlayingHere && status.playing ? (
                <Ionicons
                  name="musical-notes"
                  size={16}
                  color={Colors.teal}
                  style={{ marginRight: 8 }}
                />
              ) : isTrackPlayingHere ? (
                <Ionicons
                  name="play"
                  size={16}
                  color={Colors.teal}
                  style={{ marginRight: 8 }}
                />
              ) : null}

              {isOwnerMode && (
                <TouchableOpacity style={{ padding: 5 }} onPress={() => {
                  setSelectedTrack(item); 
                  setShowTrackOptions(true); 
                }}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />

       {/* MODAL BOTTOM: Thêm bài hát */}
      <Modal animationType="slide" transparent={true} visible={showSearchModal} onRequestClose={() => setShowSearchModal(false)}>
        <View style={styles.modalBg}>
            <View style={[styles.modalSheet, { height: '80%' }]}>
                {/* Drag Handle */}
                <View style={styles.dragHandleWrap} onTouchEnd={() => setShowSearchModal(false)}>
                    <View style={styles.dragHandle} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={20} color={Colors.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your tracks..."
                        placeholderTextColor={Colors.gray}
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                    />
                </View>

                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    style={{ flex: 1, marginTop: 10 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            {searchLoading ? (
                                <ActivityIndicator color={Colors.teal} />
                            ) : searchKeyword.length > 0 ? (
                                <Text style={{ color: Colors.gray }}>No matches found among your tracks.</Text>
                            ) : (
                                <Text style={{ color: Colors.gray }}>Type to search your tracks</Text>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.searchItem}>
                            <Image source={{ uri: item.thumbnailUrl }} style={styles.searchItemImg} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.searchItemTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.searchItemArtist} numberOfLines={1}>{getTrackArtistLabel(item)}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleAddTrack(item.id)}>
                                <Ionicons name="add-circle" size={28} color={Colors.teal} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </View>
      </Modal>

      {/* MODAL OPTIONS: Xóa Bài khỏi Album */}
      <Modal animationType="fade" transparent={true} visible={showTrackOptions} onRequestClose={() => setShowTrackOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTrackOptions(false)}>
            <View style={styles.optionsSheet}>
                <View style={styles.optionsHeader}>
                    <Text style={styles.optionsTitle}>{selectedTrack?.title}</Text>
                </View>
                <TouchableOpacity style={styles.optionItem} onPress={handleRemoveTrack}>
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Remove from Album</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  headerFixed: {
    position: "absolute",
    zIndex: 10,
    left: 10,
    height: 60,
    justifyContent: "center",
  },
  backIcon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: { alignItems: "flex-start", marginBottom: 20 },
  coverWrapper: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: 20,
    backgroundColor: "#222",
    alignSelf: "center",
    marginTop: 40,
    overflow: "hidden",
  },
  coverImg: { width: "100%", height: "100%" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  titleText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  artistLabel: { color: "#888", fontSize: 14, fontWeight: "600", marginTop: 4 },
  addBtn: { padding: 5},
  actionRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  leftActions: { flexDirection: "row", alignItems: "center" },
  songCountText: { color: "#AAA", fontSize: 13, fontWeight: "700" },
  rightActions: { flexDirection: "row", alignItems: "center" },
  playBtnLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.teal,
    justifyContent: "center",
    alignItems: "center",
  },

  // TRACK ITEM
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  trackItemActive: { backgroundColor: "transparent" },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: "#111",
  },
  trackTitle: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  trackArtist: { color: "#888", fontSize: 13, marginTop: 2 },

  // MODAL STUFF
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  dragHandleWrap: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#555' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 16 },
  searchItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 12 },
  searchItemImg: { width: 48, height: 48, borderRadius: 8 },
  searchItemTitle: { color: Colors.white, fontSize: 15, fontWeight: 'bold' },
  searchItemArtist: { color: Colors.gray, fontSize: 13, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  optionsSheet: { backgroundColor: '#222', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  optionsHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#333' },
  optionsTitle: { color: Colors.white, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  optionText: { color: Colors.white, fontSize: 16, fontWeight: '500' }
});
