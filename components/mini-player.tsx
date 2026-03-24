import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MiniPlayer() {
    const router = useRouter();
    const context = useCurrentTrack();

    // 1. Kiểm tra nếu context chưa được khởi tạo hoặc không có bài hát
    if (!context || !context.currentTrack) {
        return null; // Không hiển thị gì nếu chưa chọn bài
    }

    const { currentTrack, isPlaying, setIsPlaying } = context;

    // 2. Hàm xử lý Play/Pause
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.9}
                onPress={() => router.push('/(tabs)/player/currentsong' as any)}>

                {/* Thumbnail - Hiển thị artwork nếu có, không thì hiện icon mặc định */}
                {/* <View style={styles.thumbnail}>
                    {currentTrack.artwork ? (
                        <Image
                            source={{ uri: currentTrack.artwork }}
                            style={styles.artworkImage}
                        />
                    ) : (
                        <Ionicons name="musical-notes" size={18} color={Colors.teal} />
                    )}
                </View> */}

                {/* Song info lấy từ Context */}
                <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                        {currentTrack.title || 'Unknown Title'}
                    </Text>
                    {/* <Text style={styles.songArtist} numberOfLines={1}>
                        {currentTrack.artist || 'Unknown Artist'}
                    </Text> */}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện nhấn vào container (mở màn hình full)
                            handlePlayPause();
                        }}
                        style={styles.controlBtn}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={24}
                            color={Colors.white}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            // Logic Next bài hát sẽ thêm ở đây sau
                        }}
                        style={styles.controlBtn}>
                        <Ionicons name="play-skip-forward" size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: Colors.tabBar,
        borderTopWidth: 0.5,
        borderTopColor: '#222',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        // Shadow cho iOS/Android
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    thumbnail: {
        width: 42,
        height: 42,
        borderRadius: 8,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    songInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    songTitle: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 1,
    },
    songArtist: {
        color: Colors.gray,
        fontSize: 12,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    controlBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});