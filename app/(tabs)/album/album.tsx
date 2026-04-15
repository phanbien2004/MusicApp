import { IMAGE } from "@/constants/image";
import { Colors } from "@/constants/theme";
import { useCurrentTrack } from "@/context/currentTrack-context";
import { usePlayer } from "@/context/player-context";
import { AlbumDetail, getAlbumDetailAPI } from "@/services/albumService";
import { TrackContentType } from "@/services/searchService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
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
  }>();
  const albumId = Number(params.id);

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

  // --- LOGIC PHÁT NHẠC ---
  const handleTogglePlayAlbum = async () => {
    if (!detail?.tracks?.length) return;

    const isSameContext = activePlaylistId === detail.id.toString();

    if (!isSameContext) {
      // Phát bài đầu tiên của album này
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
    } else {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
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
        <ActivityIndicator color={Colors.teal} size="large" />
      </View>
    );
  if (!detail) return null;

  const handleBack = () => {
    const tab = lastActiveTab || "search";
    router.navigate(`/(tabs)/${tab}` as any);
  };

  const isPlayingAlbum =
    status.playing && activePlaylistId === detail.id.toString();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACK BUTTON */}
      <View style={[styles.headerFixed, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={detail.tracks}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: 150,
        }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.coverWrapper}>
              {detail.thumbnailUrl ? (
                <Image
                  source={{ uri: detail.thumbnailUrl }}
                  style={styles.coverImg}
                />
              ) : (
                <Image
                  source={IMAGE.defaultThumbnail}
                  style={styles.coverImg}
                />
              )}
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titleText} numberOfLines={2}>
                  {detail.title}
                </Text>
                <Text style={styles.artistLabel}>
                  {detail.artistName || "Unknown Artist"}
                </Text>
              </View>
              <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add-circle-outline" size={28} color="#FFF" />
              </TouchableOpacity>
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

              <TouchableOpacity style={{ padding: 5 }}>
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
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
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  titleText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  artistLabel: { color: "#888", fontSize: 14, fontWeight: "600", marginTop: 4 },
  addBtn: { padding: 5, marginTop: -5 },
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
});
