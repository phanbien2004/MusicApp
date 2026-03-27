import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ApplicantDetail() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>APPLICANT DETAIL</Text>
                        <Text style={styles.headerSubtitle}>AWAITING VERIFICATION</Text>
                    </View>
                </View>

                {/* ... (Các phần Profile, Asset, Biography giữ nguyên như cũ) ... */}
                
                <View style={styles.profileSection}>
                    <View style={styles.largeAvatar} />
                    <Text style={styles.artistName}>ARTIST 01</Text>
                    <Text style={styles.appliedTime}>Applied 10 hours ago</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>IDENTIFY ASSET</Text>
                    <View style={styles.assetBox} />
                </View>

                <View style={styles.section}>
                    <View style={styles.bioBox}>
                        <Text style={styles.sectionLabel}>BIOGRAPHY</Text>
                        <Text style={styles.bioText}>
                            Electronic producer from Berlin focusing on atmospheric phonk and dark synthwave textures. 
                        </Text>
                    </View>
                </View>

                {/* ─── ACTIONS ─── */}
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.approveBtn}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={Colors.teal} />
                        <Text style={styles.approveText}>APPROVE & VERIFY ARTIST</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rejectBtn}>
                        <Ionicons name="close-circle-outline" size={24} color="#FF5555" />
                        <Text style={styles.rejectText}>REJECT APPLICATION</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

// Styles giữ nguyên như turn trước, chỉ cần xóa thuộc tính paddingTop cố định trong container nếu có
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
    backBtn: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    headerSubtitle: { color: Colors.teal, fontSize: 11, fontWeight: '700' },
    profileSection: { alignItems: 'center', marginVertical: 30 },
    largeAvatar: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#CCC' },
    artistName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 15 },
    appliedTime: { color: '#666', fontSize: 13, marginTop: 5 },
    section: { paddingHorizontal: 25, marginBottom: 25 },
    sectionLabel: { color: Colors.teal, fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
    assetBox: { width: '100%', height: 180, borderRadius: 24, backgroundColor: '#333' },
    bioBox: { borderWidth: 1, borderColor: '#333', borderRadius: 20, padding: 20 },
    bioText: { color: '#BBB', fontSize: 13, lineHeight: 20 },
    actionSection: { paddingHorizontal: 25, gap: 15 },
    approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2A1A', padding: 18, borderRadius: 30, borderWidth: 1, borderColor: '#2E4D2E', gap: 10 },
    approveText: { color: Colors.teal, fontWeight: 'bold', fontSize: 13 },
    rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A1A1A', padding: 18, borderRadius: 30, borderWidth: 1, borderColor: '#4D2E2E', gap: 10 },
    rejectText: { color: '#FF5555', fontWeight: 'bold', fontSize: 13 },
});