import { usePlayer } from '@/context/player-context';
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

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '--/--/----';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
}

function isValidDateString(dateStr?: string | null): dateStr is string {
    return Boolean(dateStr && !Number.isNaN(new Date(dateStr).getTime()));
}

function daysRemaining(endDateStr?: string | null): number {
    if (!isValidDateString(endDateStr)) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export default function MySubscriptionScreen() {
    const router = useRouter();
    const { lastActiveTab } = usePlayer();

    const [subscription, setSubscription] = useState<MySubscriptionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => {
        const tab = lastActiveTab || 'profile';
        router.navigate(`/(tabs)/${tab}` as any);
    };

    useFocusEffect(
        useCallback(() => {
            const fetchSubscription = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getMySubscriptionAPI();
                    setSubscription(data);
                } catch (err: any) {
                    const msg = err.response?.data?.message || err.message || 'Cannot load subscription info.';
                    setError(msg);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchSubscription();
        }, [])
    );

    const isPremiumActive =
        Boolean(subscription?.isActive) &&
        subscription?.subscriptionType === 'PREMIUM';

    const remaining = subscription ? daysRemaining(subscription.endDate) : 0;

    const progressPercent = (() => {
        if (
            !subscription ||
            !isPremiumActive ||
            !isValidDateString(subscription.startDate) ||
            !isValidDateString(subscription.endDate)
        ) {
            return 0;
        }

        const start = new Date(subscription.startDate).getTime();
        const end = new Date(subscription.endDate).getTime();
        const now = Date.now();
        const total = end - start;
        if (total <= 0) return 0;

        const elapsed = now - start;
        return Math.max(0, Math.min(1, 1 - elapsed / total));
    })();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Premium Subscription</Text>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.teal} />
                    <Text style={styles.loadingText}>Loading info...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : subscription && isPremiumActive ? (
                <View style={styles.content}>
                    <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.teal} />
                        <Text style={styles.statusText}>ACTIVE</Text>
                    </View>

                    <View style={styles.planCard}>
                        <View style={styles.planHeader}>
                            <View style={styles.crownCircle}>
                                <Ionicons name="star" size={22} color="#FFD700" />
                            </View>
                            <View style={styles.planInfo}>
                                <Text style={styles.planLabel}>SUBSCRIPTION PLAN</Text>
                                <Text style={styles.planName}>{subscription.planName || 'Premium'}</Text>
                            </View>
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceText}>
                                    {subscription.price.toLocaleString('vi-VN')} VND
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.datesRow}>
                            <View style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
                                <View>
                                    <Text style={styles.dateLabel}>Start Date</Text>
                                    <Text style={styles.dateValue}>{formatDate(subscription.startDate)}</Text>
                                </View>
                            </View>
                            <View style={styles.dateSeparator} />
                            <View style={styles.dateItem}>
                                <Ionicons name="time-outline" size={16} color={Colors.gray} />
                                <View>
                                    <Text style={styles.dateLabel}>Expiration Date</Text>
                                    <Text style={styles.dateValue}>{formatDate(subscription.endDate)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.progressSection}>
                            <View style={styles.progressLabelRow}>
                                <Text style={styles.progressLabel}>Time Remaining</Text>
                                <Text style={[styles.remainingDays, remaining <= 7 && styles.remainingDaysWarning]}>
                                    {remaining > 0 ? `${remaining} days` : 'Expired'}
                                </Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progressPercent * 100}%` },
                                        remaining > 0 && remaining <= 7 && styles.progressFillWarning,
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.gray} />
                        <Text style={styles.infoText}>
                            The plan will automatically expire on {formatDate(subscription.endDate)}.
                            {' '}You can renew before it expires.
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={styles.centered}>
                    <Ionicons name="diamond-outline" size={46} color={Colors.gray} />
                    <Text style={styles.emptyTitle}>No Active Premium</Text>
                    <Text style={styles.emptyText}>
                        Your account does not have an active Premium subscription right now.
                    </Text>
                    <TouchableOpacity style={styles.backToSettingsBtn} onPress={handleBack}>
                        <Text style={styles.backToSettingsText}>Back to Settings</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },
    headerSpacer: {
        width: 36,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 24,
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
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.white,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.gray,
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 24,
    },
    backToSettingsBtn: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    backToSettingsText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.white,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },
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
    planInfo: {
        flex: 1,
    },
    crownCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2A2200',
        alignItems: 'center',
        justifyContent: 'center',
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
    remainingDaysWarning: {
        color: '#FF9500',
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
    progressFillWarning: {
        backgroundColor: '#FF9500',
    },
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
