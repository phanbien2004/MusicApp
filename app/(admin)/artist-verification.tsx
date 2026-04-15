import { Colors } from '@/constants/theme';
import { AllPendingArtistProfilePreviewDTO, getAllPendingArtistProfilesAPI } from '@/services/admin/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArtistVerification() {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // Lấy thông tin vùng an toàn
    
    const [pendingList, setPendingList] = useState<AllPendingArtistProfilePreviewDTO[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchPendingArtists();
        }, [])
    );

    const fetchPendingArtists = async () => {
        try {
            const data = await getAllPendingArtistProfilesAPI();
            setPendingList(data);
        } catch (error) {
            console.error("Error fetching pending artists:", error);
        }
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>ARTIST REGISTRY</Text>
                    <Text style={styles.headerSubtitle}>{pendingList.length} PENDING APPLICATION{pendingList.length !== 1 ? 'S' : ''}</Text>
                </View>
            </View>

            {/* ─── LIST ─── */}
            <FlatList
                data={pendingList}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    // Logic tính thời gian hiển thị (tạm thời để hiển thị ngày tạo hoặc text thô nếu cần)
                    // const timeAgo = calculateTimeAgo(item.createdAt); 
                    
                    return (
                        <TouchableOpacity 
                            style={styles.card} 
                            onPress={() => router.push({
                                pathname: '/(admin)/applicant-detail',
                                params: { id: item.id.toString() }
                            } as any)}
                        >
                            {item.avatarUrl ? (
                                <Image source={{ uri: item.avatarUrl }} style={styles.avatarPlaceholder} />
                            ) : (
                                <View style={styles.avatarPlaceholder} />
                            )}
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.stageName  || "Unknown Artist"}</Text>
                                {/* Có thể hiển thị createdAt chỗ này */}
                                <Text style={styles.time}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
                            </View>
                            <Ionicons name="eye-outline" size={24} color="#666" />
                        </TouchableOpacity>
                    );
                }}
            />

            {/* ─── PAGINATION (Sử dụng insets.bottom để tránh vạch home) ─── */}
            <View style={[styles.pagination, { marginBottom: insets.bottom + 10 }]}>
                <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#FFF" /></TouchableOpacity>
                <Text style={styles.pageText}>1 / 17</Text>
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
    listContent: { padding: 20, gap: 15 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 16, borderRadius: 24 },
    avatarPlaceholder: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#1A2A2A' },
    info: { flex: 1, marginLeft: 15 },
    name: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    time: { color: '#666', fontSize: 12, marginTop: 2 },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    pageText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});

