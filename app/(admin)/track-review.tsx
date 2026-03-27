import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_TRACKS = [
    { id: '1', title: 'Track 01', artist: 'Athor ft Abc, Chicke', duration: '3:36', currentTime: '1:18', tags: ['Lo-fi', 'Chill'] },
    { id: '2', title: 'Track 02', artist: 'Athor' },
    { id: '3', title: 'Track 03', artist: 'Athor' },
    { id: '4', title: 'Track 04', artist: 'Athor' },
    { id: '5', title: 'Track 05', artist: 'Athor' },
    { id: '6', title: 'Track 06', artist: 'Athor' },
];

export default function TrackReview() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [playingId, setPlayingId] = useState<string | null>('1'); // Mặc định bài 1 đang mở rộng

    const renderTrackItem = ({ item }: { item: typeof MOCK_TRACKS[0] }) => {
        const isExpanded = playingId === item.id;

        return (
            <View style={[styles.card, isExpanded && styles.cardActive]}>
                <View style={styles.cardHeader}>
                    {/* Play Button */}
                    <TouchableOpacity 
                        style={[styles.playBtn, isExpanded && styles.playBtnActive]}
                        onPress={() => setPlayingId(isExpanded ? null : item.id)}
                    >
                        <Ionicons name={isExpanded ? "pause" : "play"} size={24} color={isExpanded ? Colors.teal : "#FFF"} />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{item.title}</Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.rejectBtn}>
                            <Ionicons name="close" size={20} color="#FF5555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.approveBtn}>
                            <Ionicons name="checkmark" size={20} color={Colors.teal} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Phần mở rộng khi đang nghe thử */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.tagRow}>
                            {item.tags?.map(tag => (
                                <View key={tag} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressFill, { width: '40%' }]} />
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>{item.currentTime}</Text>
                                <Text style={styles.timeText}>{item.duration}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>TRACK REVIEW</Text>
                    <Text style={styles.headerSubtitle}>124 NEWS SUBMISSIONS</Text>
                </View>
            </View>

            {/* ─── LIST ─── */}
            <FlatList
                data={MOCK_TRACKS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderTrackItem}
                showsVerticalScrollIndicator={false}
            />

            {/* ─── PAGINATION ─── */}
            <View style={[styles.pagination, { marginBottom: insets.bottom + 10 }]}>
                <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#FFF" /></TouchableOpacity>
                <Text style={styles.pageText}>1 / 21</Text>
                <TouchableOpacity><Ionicons name="chevron-forward" size={20} color="#FFF" /></TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
    backBtn: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    headerSubtitle: { color: Colors.teal, fontSize: 11, fontWeight: '700' },
    
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#121212', borderRadius: 28, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
    cardActive: { borderColor: '#333' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    
    playBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
    playBtnActive: { backgroundColor: '#1A2A2A', borderWidth: 1, borderColor: Colors.teal },
    
    trackInfo: { flex: 1, marginLeft: 16 },
    trackTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    trackArtist: { color: '#888', fontSize: 12, marginTop: 2 },
    
    actionRow: { flexDirection: 'row', gap: 8 },
    rejectBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4D2E2E' },
    approveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A2A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E4D2E' },

    expandedContent: { marginTop: 15, paddingHorizontal: 4 },
    tagRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    tag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#A855F7' },
    tagText: { color: '#A855F7', fontSize: 12, fontWeight: 'bold' },
    
    progressContainer: { marginTop: 5 },
    progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.teal },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { color: '#666', fontSize: 11, fontWeight: 'bold' },

    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 10 },
    pageText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});