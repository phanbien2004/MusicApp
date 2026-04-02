import { Colors } from '@/constants/theme';
import { getMySubscriptionAPI, MySubscriptionResponse } from '@/services/paymentService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Helper ───────────────────────────────────────────────────────

/** Format "YYYY-MM-DD" → "DD/MM/YYYY" */
function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

/** Tính số ngày còn lại */
function daysRemaining(endDateStr: string): number {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

// ─── Main Screen ──────────────────────────────────────────────────

export default function MySubscriptionScreen() {
    const router = useRouter();

    const [subscription, setSubscription] = useState<MySubscriptionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tự reload mỗi lần màn hình được focus
    useFocusEffect(
        useCallback(() => {
            const fetchSubscription = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getMySubscriptionAPI();
                    setSubscription(data);
                } catch (err: any) {
                    const msg = err.response?.data?.message || err.message || 'Không thể tải thông tin gói.';
                    setError(msg);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSubscription();
        }, [])
    );

    const remaining = subscription ? daysRemaining(subscription.endDate) : 0;

    // ── Progress bar: phần trăm thời gian còn lại ──
    const progressPercent = (() => {
        if (!subscription) return 0;
        const start = new Date(subscription.startDate).getTime();
        const end = new Date(subscription.endDate).getTime();
        const now = Date.now();
        const total = end - start;
        const elapsed = now - start;
        const pct = Math.max(0, Math.min(1, 1 - elapsed / total));
        return pct; // 1.0 = mới đăng ký, 0.0 = hết hạn
    })();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gói Premium của tôi</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* ─── CONTENT ─── */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.teal} />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : subscription ? (
                <View style={styles.content}>

                    {/* ── Status Badge ── */}
                    <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.teal} />
                        <Text style={styles.statusText}>ĐANG ACTIVE</Text>
                    </View>

                    {/* ── Plan Card ── */}
                    <View style={styles.planCard}>
                        {/* Crown icon + name */}
                        <View style={styles.planHeader}>
                            <View style={styles.crownCircle}>
                                <Ionicons name="star" size={22} color="#FFD700" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.planLabel}>GÓI ĐĂNG KÝ</Text>
                                <Text style={styles.planName}>{subscription.planName}</Text>
                            </View>
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceText}>
                                    {subscription.price.toLocaleString('vi-VN')}₫
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Dates */}
                        <View style={styles.datesRow}>
                            <View style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
                                <View>
                                    <Text style={styles.dateLabel}>Ngày đăng ký</Text>
                                    <Text style={styles.dateValue}>
                                        {formatDate(subscription.startDate)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.dateSeparator} />
                            <View style={styles.dateItem}>
                                <Ionicons name="time-outline" size={16} color={Colors.gray} />
                                <View>
                                    <Text style={styles.dateLabel}>Ngày hết hạn</Text>
                                    <Text style={styles.dateValue}>
                                        {formatDate(subscription.endDate)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Progress bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressLabelRow}>
                                <Text style={styles.progressLabel}>Thời gian còn lại</Text>
                                <Text style={styles.remainingDays}>
                                    {remaining > 0 ? `${remaining} ngày` : 'Hết hạn'}
                                </Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progressPercent * 100}%` },
                                        remaining <= 7 && { backgroundColor: '#FF9500' }, // cảnh báo gần hết
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* ── Info note ── */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.gray} />
                        <Text style={styles.infoText}>
                            Gói sẽ tự động hết hạn vào ngày {formatDate(subscription.endDate)}.
                            Bạn có thể gia hạn trước khi hết hạn.
                        </Text>
                    </View>

                </View>
            ) : null}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E1E1E',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },

    // Loading / Error
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.gray,
    },
    errorText: {
        fontSize: 14,
        color: '#FF6B6B',
        textAlign: 'center',
        paddingHorizontal: 32,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },

    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: Colors.teal + '18',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.teal + '44',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 1.5,
    },

    // Plan card
    planCard: {
        backgroundColor: '#0D0D0D',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        padding: 20,
        gap: 16,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    crownCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#2A2200',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFD70033',
    },
    planLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    planName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.white,
    },
    priceBadge: {
        backgroundColor: Colors.teal + '22',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.teal + '44',
    },
    priceText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.teal,
    },

    divider: {
        height: 1,
        backgroundColor: '#1E1E1E',
    },

    // Dates
    datesRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateSeparator: {
        width: 1,
        height: 40,
        backgroundColor: '#1E1E1E',
        marginHorizontal: 12,
    },
    dateLabel: {
        fontSize: 11,
        color: Colors.gray,
        marginBottom: 3,
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
    },

    // Progress
    progressSection: {
        gap: 8,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        color: Colors.gray,
    },
    remainingDays: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.teal,
    },
    progressTrack: {
        height: 6,
        backgroundColor: '#1E1E1E',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.teal,
        borderRadius: 3,
    },

    // Info box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        padding: 14,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 19,
    },
});
