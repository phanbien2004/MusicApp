import { Colors } from '@/constants/theme';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Bắt buộc import hook này
import { useAudioPlayerStatus } from 'expo-audio';

// COMPONENT CHA: Kiểm tra null an toàn
export default function MiniPlayer() {
    const context = useCurrentTrack();

    if (!context || !context.currentTrack || !context.player) return null;

    return <MiniPlayerUI currentTrack={context.currentTrack} player={context.player} />;
}

// COMPONENT CON: Xử lý giao diện
function MiniPlayerUI({ currentTrack, player }: { currentTrack: any, player: any }) {
    const router = useRouter();
    
    // Lấy thông tin thời gian thực cực chuẩn xác
    const status = useAudioPlayerStatus(player);

    const handlePlayPause = (e: any) => {
        e.stopPropagation();
        if (status.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    // Tính % thanh progress (bảo vệ lỗi chia cho 0)
    const duration = status.duration > 0 ? status.duration : 1;
    const progressPercent = (status.currentTime / duration) * 100;

    return (
        <View style={styles.wrapper}>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.9}
                onPress={() => router.push('/(tabs)/player/currentTrack' as any)}
            >
                <View style={styles.thumbnail}>
                    {currentTrack.thumbnailUrl ? (
                        <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.artworkImage} />
                    ) : (
                        <Ionicons name="musical-notes" size={20} color={Colors.teal} />
                    )}
                </View>

                <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{currentTrack.title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                        {currentTrack.contributors?.at(0)?.name || 'Nghệ sĩ'}
                    </Text>
                </View>

                <View style={styles.controls}>
                    {/* UI Tự Động Phản Ứng Theo Engine */}
                    <TouchableOpacity onPress={handlePlayPause}>
                        <Ionicons name={status.playing ? 'pause' : 'play'} size={28} color={Colors.white} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlBtn} onPress={(e) => e.stopPropagation()}>
                        <Ionicons name="play-skip-forward" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
}

// (Giữ nguyên phần StyleSheet của bạn)
// const styles = StyleSheet.create({...});
const styles = StyleSheet.create({
    wrapper: { width: '100%', paddingHorizontal: 10, zIndex: 9999 },
    container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, elevation: 10 },
    thumbnail: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
    artworkImage: { width: '100%', height: '100%' },
    songInfo: { flex: 1 },
    songTitle: { color: Colors.white, fontSize: 14, fontWeight: 'bold' },
    songArtist: { color: Colors.gray, fontSize: 11, marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    controlBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    progressBarContainer: {
        height: 3, // Độ dày của thanh (bạn có thể tăng lên 4 hoặc 5 nếu muốn nhìn rõ hơn)
        backgroundColor: '#333333', // Màu nền của phần nhạc chưa phát tới
        width: '100%',
        overflow: 'hidden',
        // Bo góc nhẹ ở phía trên để khớp với UI
        borderTopLeftRadius: 4, 
        borderTopRightRadius: 4,
    },

    // 2. Phần thanh trượt thể hiện % đã phát (Màu nổi bật)
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.teal, // Màu chủ đạo của App (hoặc dùng mã màu như '#1DB954')
        borderRadius: 4, // Bo tròn nhẹ đầu thanh trượt nhìn sẽ mềm mại hơn
    },
});