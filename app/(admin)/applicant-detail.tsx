import { Colors } from '@/constants/theme';
import {
    AdminArtistProfileDTO,
    approveArtistProfileAPI,
    getArtistProfileByIdAPI,
    rejectArtistProfileAPI
} from '@/services/admin/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ApplicantDetail() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [profile, setProfile] = React.useState<AdminArtistProfileDTO | null>(null);
    const [toastMessage, setToastMessage] = React.useState<{ text: string, type: 'success' | 'error' } | null>(null);

    React.useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await getArtistProfileByIdAPI(id);
            setProfile(data);
        } catch (error) {
            console.error("Lỗi fetch chi tiết artist:", error);
            showToast("Không thể lấy thông tin đăng ký", "error");
        }
    }

    const showToast = (text: string, type: 'success' | 'error', autoBack: boolean = false) => {
        setToastMessage({ text, type });
        setTimeout(() => {
            setToastMessage(null);
            if (autoBack) router.back();
        }, 1500);
    }

    const handleApprove = async () => {
        if (!id || profile?.status !== 'PENDING') return;
        setIsSubmitting(true);
        try {
            await approveArtistProfileAPI(id);
            showToast("Đã duyệt nghệ sĩ thành công!", "success", true);
        } catch (error) {
            console.error("Lỗi approve:", error);
            showToast("Duyệt thất bại", "error");
            setIsSubmitting(false);
        }
    }

    const handleReject = async () => {
        if (!id || profile?.status !== 'PENDING') return;
        setIsSubmitting(true);
        try {
            await rejectArtistProfileAPI(id);
            showToast("Đã từ chối đơn đăng ký!", "success", true);
        } catch (error) {
            console.error("Lỗi reject:", error);
            showToast("Từ chối thất bại", "error");
            setIsSubmitting(false);
        }
    }

    if (!profile) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={Colors.teal} />
            </View>
        );
    }

    const isActionDisabled = isSubmitting || profile.status !== 'PENDING';

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
                    {profile.avatarUrl ? (
                        <Image source={{ uri: profile.avatarUrl }} style={styles.largeAvatar} />
                    ) : (
                        <View style={styles.largeAvatar} />
                    )}
                    <Text style={styles.artistName}>{profile.stageName}</Text>
                    <Text style={styles.appliedTime}>
                        Applied {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>IDENTIFY ASSET (COVER)</Text>
                    {profile.coverUrl ? (
                        <Image source={{ uri: profile.coverUrl }} style={styles.assetBox} resizeMode="cover" />
                    ) : (
                        <View style={styles.assetBox} />
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.bioBox}>
                        <Text style={styles.sectionLabel}>BIOGRAPHY</Text>
                        <Text style={styles.bioText}>
                            {profile.bio || "No biography provided."}
                        </Text>
                    </View>
                </View>

                {/* ─── ACTIONS ─── */}
                <View style={styles.actionSection}>
                    <TouchableOpacity 
                        style={[styles.approveBtn, isActionDisabled && { opacity: 0.5 }]} 
                        onPress={handleApprove} 
                        disabled={isActionDisabled}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={Colors.teal} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.teal} />
                                <Text style={styles.approveText}>APPROVE & VERIFY ARTIST</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.rejectBtn, isActionDisabled && { opacity: 0.5 }]} 
                        onPress={handleReject} 
                        disabled={isActionDisabled}
                    >
                        <Ionicons name="close-circle-outline" size={24} color="#FF5555" />
                        <Text style={styles.rejectText}>REJECT APPLICATION</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ─── TOAST NOTIFICATION ─── */}
            {toastMessage && (
                <View style={[styles.toastContainer, toastMessage.type === 'error' && styles.toastError]}>
                    <Ionicons 
                        name={toastMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                        size={20} 
                        color={toastMessage.type === 'success' ? Colors.teal : '#FF5555'} 
                    />
                    <Text style={[styles.toastText, toastMessage.type === 'error' && { color: '#FF5555' }]}>
                        {toastMessage.text}
                    </Text>
                </View>
            )}
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
    toastContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A2A1A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2E4D2E',
        gap: 10,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    toastError: {
        backgroundColor: '#2A1111',
        borderColor: '#4D2E2E',
    },
    toastText: { color: Colors.teal, fontWeight: 'bold', fontSize: 13 },
    rejectText: { color: '#FF5555', fontWeight: 'bold', fontSize: 13 },
});