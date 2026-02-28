import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

interface MiniPlayerProps {
    title?: string;
    artist?: string;
    onPlayPause?: () => void;
    onNext?: () => void;
}

export default function MiniPlayer({
    title = 'Em của ngày hôm qua',
    artist = 'Sơn Tùng MTP',
    onPlayPause,
    onNext,
}: MiniPlayerProps) {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(true);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
        onPlayPause?.();
    };

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/currentsong')}>
                {/* Thumbnail */}
                <View style={styles.thumbnail}>
                    <Ionicons name="musical-notes" size={16} color={Colors.teal} />
                </View>

                {/* Song info */}
                <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{artist}</Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handlePlayPause(); }}
                        style={styles.controlBtn}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={22}
                            color={Colors.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); onNext?.(); }}
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.tabBar,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#333',
        // Shadow Android
        elevation: 8,
    },
    thumbnail: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.teal,
    },
    songInfo: {
        flex: 1,
        marginRight: 8,
    },
    songTitle: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    songArtist: {
        color: Colors.gray,
        fontSize: 11,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    controlBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
});
