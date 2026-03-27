import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_DATA = [
    { id: '1', name: 'Artist 01', time: '10h AGO' },
    { id: '2', name: 'Artist 02', time: '8h AGO' },
    { id: '3', name: 'Artist 03', time: '4h AGO' },
    { id: '4', name: 'Artist 04', time: '2h AGO' },
    { id: '5', name: 'Artist 05', time: '2h AGO' },
];

export default function ArtistVerification() {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // Lấy thông tin vùng an toàn

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
                    <Text style={styles.headerSubtitle}>84 PENDING APPLICATION</Text>
                </View>
            </View>

            {/* ─── LIST ─── */}
            <FlatList
                data={MOCK_DATA}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card} 
                        onPress={() => router.push('/(admin)/applicant-detail' as any)}
                    >
                        <View style={styles.avatarPlaceholder} />
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.time}>{item.time}</Text>
                        </View>
                        <Ionicons name="eye-outline" size={24} color="#666" />
                    </TouchableOpacity>
                )}
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