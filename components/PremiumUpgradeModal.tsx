/**
 * PremiumUpgradeModal.tsx
 *
 * Modal chọn gói Premium + mở WebView PayOS.
 *
 * Luồng:
 *  1. Hiển thị danh sách gói (từ API GET /subscription-plan/all)
 *  2. User chọn gói → bấm "Thanh toán" → gọi POST /payment/checkout → nhận paymentUrl
 *  3. Mở PayOS WebView fullscreen (Modal riêng)
 *  4. Lắng nghe navigation state: nếu URL == SUCCESS_URL → đóng, reload profile, toast thành công
 *     Nếu URL == CANCEL_URL → đóng, toast hủy
 *
 * Props:
 *  visible      - hiển thị modal
 *  onClose      - callback khi đóng
 *  onSuccess    - callback khi thanh toán THÀNH CÔNG (để parent reload profile)
 */

import { Colors } from '@/constants/theme';
import {
    createPaymentCheckoutAPI,
    getSubscriptionPlansAPI,
    SubscriptionPlan,
    waitForPremiumSubscriptionAPI,
} from '@/services/paymentService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';

// ─── Constants ────────────────────────────────────────────────────

/**
 * URL mà PayOS sẽ redirect về sau khi:
 * - Thanh toán thành công → SUCCESS_URL
 * - User bấm hủy         → CANCEL_URL
 *
 * Phải khớp với returnUrl / cancelUrl bạn cấu hình trong Backend:
 * application.properties: payos.return-url=http://localhost:8081/payment/success
 *                          payos.cancel-url=http://localhost:8081/payment/cancel
 */
const SUCCESS_URL = 'http://localhost:8081/payments/success';
const CANCEL_URL  = 'http://localhost:8081/payments/cancel';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Helper ───────────────────────────────────────────────────────

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + '₫';
}

function formatDuration(days: number): string {
    if (days >= 30 && days % 30 === 0) return `${days / 30} tháng`;
    if (days >= 7  && days % 7  === 0) return `${days / 7} tuần`;
    return `${days} ngày`;
}

// ─── Sub-component: WebView Modal ─────────────────────────────────

interface PayOSWebViewProps {
    paymentUrl: string;
    onSuccess: () => void;
    onCancel:  () => void;
    onClose:   () => void;
}

function PayOSWebView({ paymentUrl, onSuccess, onCancel, onClose }: PayOSWebViewProps) {
    const [isWebViewLoading, setIsWebViewLoading] = useState(true);

    const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
        const url = navState.url;
        console.log('[PayOS WebView] URL:', url);

        if (url.startsWith(SUCCESS_URL)) {
            console.log('[PayOS] Thanh toán thành công!');
            onSuccess();
            return;
        }
        if (url.startsWith(CANCEL_URL)) {
            console.log('[PayOS] User hủy thanh toán.');
            onCancel();
            return;
        }
    }, [onSuccess, onCancel]);

    return (
        <SafeAreaView style={webViewStyles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={webViewStyles.header}>
                <TouchableOpacity style={webViewStyles.closeBtn} onPress={onClose}>
                    <Ionicons name="close" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={webViewStyles.headerTitle}>Thanh toán PayOS</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Loading overlay */}
            {isWebViewLoading && (
                <View style={webViewStyles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.teal} />
                    <Text style={webViewStyles.loadingText}>Đang tải cổng thanh toán...</Text>
                </View>
            )}

            <WebView
                source={{ uri: paymentUrl }}
                onShouldStartLoadWithRequest={(request) => {
                    const url = request.url;
                    if (url.startsWith(SUCCESS_URL)) {
                        console.log('[PayOS] Thanh toán thành công (intercepted)!');
                        onSuccess();
                        return false;
                    }
                    if (url.startsWith(CANCEL_URL)) {
                        console.log('[PayOS] User hủy thanh toán (intercepted).');
                        onCancel();
                        return false;
                    }
                    return true;
                }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadEnd={() => setIsWebViewLoading(false)}
                onError={(e: any) => {
                    console.error('[PayOS WebView] Error:', e.nativeEvent.description);
                    Alert.alert('Lỗi', 'Không thể tải trang thanh toán. Vui lòng thử lại.');
                    onClose();
                }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
            />
        </SafeAreaView>
    );
}

const webViewStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1E1E1E',
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.gray,
    },
});

// ─── Sub-component: Plan Card ──────────────────────────────────────

interface PlanCardProps {
    plan: SubscriptionPlan;
    selected: boolean;
    onPress: () => void;
}

function PlanCard({ plan, selected, onPress }: PlanCardProps) {
    const isPopular = plan.durationDays >= 30; // gói từ 1 tháng trở lên hiển thị badge

    return (
        <TouchableOpacity
            style={[planCardStyles.card, selected && planCardStyles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {isPopular && (
                <View style={planCardStyles.popularBadge}>
                    <Text style={planCardStyles.popularText}>PHỔ BIẾN</Text>
                </View>
            )}
            <View style={planCardStyles.radio}>
                {selected && <View style={planCardStyles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={planCardStyles.planName}>{plan.name}</Text>
                <Text style={planCardStyles.planDuration}>
                    {formatDuration(plan.durationDays)}
                </Text>
            </View>
            <Text style={[planCardStyles.planPrice, selected && planCardStyles.planPriceSelected]}>
                {formatPrice(plan.price)}
            </Text>
        </TouchableOpacity>
    );
}

const planCardStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
        padding: 16,
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
    },
    cardSelected: {
        borderColor: Colors.teal,
        backgroundColor: Colors.teal + '10',
    },
    popularBadge: {
        position: 'absolute',
        top: 0, right: 0,
        backgroundColor: Colors.teal,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderBottomLeftRadius: 8,
    },
    popularText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 1,
    },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: '#444',
        alignItems: 'center', justifyContent: 'center',
    },
    radioInner: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: Colors.teal,
    },
    planName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
        marginBottom: 2,
    },
    planDuration: {
        fontSize: 12,
        color: Colors.gray,
    },
    planPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.grayLight,
    },
    planPriceSelected: {
        color: Colors.teal,
    },
});

// ─── Main Component: PremiumUpgradeModal ──────────────────────────

interface PremiumUpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void; // gọi sau khi webhook OK và user thấy kết quả
}

export default function PremiumUpgradeModal({ visible, onClose, onSuccess }: PremiumUpgradeModalProps) {

    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Trạng thái WebView PayOS
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showWebView, setShowWebView] = useState(false);

    // Fetch danh sách plan khi modal mở
    useEffect(() => {
        if (!visible) return;
        const fetchPlans = async () => {
            setIsLoadingPlans(true);
            try {
                const data = await getSubscriptionPlansAPI();
                setPlans(data);
                // Auto-select gói đầu tiên
                if (data.length > 0) setSelectedPlanId(data[0].id);
            } catch (err: any) {
                console.error('[PremiumModal] Lỗi fetch plans:', err);
                Alert.alert('Lỗi', 'Không thể tải danh sách gói. Vui lòng thử lại.');
            } finally {
                setIsLoadingPlans(false);
            }
        };
        fetchPlans();
    }, [visible]);

    // ── Bước 1: User bấm "Thanh toán ngay" ──
    const handleCheckout = async () => {
        if (!selectedPlanId) {
            Alert.alert('Thông báo', 'Vui lòng chọn một gói Premium.');
            return;
        }
        setIsCheckingOut(true);
        try {
            console.log('[PayOS] Gọi checkout với planId:', selectedPlanId);
            const response = await createPaymentCheckoutAPI(selectedPlanId);
            console.log('[PayOS] Nhận paymentUrl:', response.paymentUrl);

            // Lưu URL và mở WebView
            setPaymentUrl(response.paymentUrl);
            setShowWebView(true);
        } catch (err: any) {
            console.error('[PayOS] Checkout error:', err);
            const msg = err.response?.data?.message || err.message || 'Không thể tạo đơn thanh toán.';
            Alert.alert('Lỗi', msg);
        } finally {
            setIsCheckingOut(false);
        }
    };

    // ── Bước 2a: WebView báo SUCCESS ──
    const handlePaymentSuccess = () => {
        const finalizePayment = async () => {
            setShowWebView(false);
            setPaymentUrl(null);

            try {
                const subscription = await waitForPremiumSubscriptionAPI();
                onClose();
                Alert.alert(
                    'Thanh toán thành công!',
                    `Gói ${subscription.planName} đã được kích hoạt đến ${subscription.endDate ?? 'N/A'}.`,
                    [{ text: 'OK', onPress: onSuccess }]
                );
            } catch (error) {
                console.error('[PayOS] Verify premium status error:', error);
                onClose();
                Alert.alert(
                    'Thanh toán đã hoàn tất',
                    'Đã nhận redirect thành công nhưng chưa xác nhận được gói Premium. Vui lòng mở lại Account Settings sau vài giây để kiểm tra.'
                );
            }
        };

        finalizePayment();
    };

    // ── Bước 2b: WebView báo CANCEL ──
    const handlePaymentCancel = () => {
        setShowWebView(false);
        setPaymentUrl(null);
        Alert.alert('Đã hủy', 'Giao dịch thanh toán đã bị hủy.');
    };

    // ── Đóng WebView thủ công (nút X) ──
    const handleCloseWebView = () => {
        Alert.alert(
            'Thoát thanh toán?',
            'Bạn có chắc muốn thoát? Giao dịch chưa hoàn tất sẽ bị hủy.',
            [
                { text: 'Tiếp tục thanh toán', style: 'cancel' },
                {
                    text: 'Thoát',
                    style: 'destructive',
                    onPress: () => {
                        setShowWebView(false);
                        setPaymentUrl(null);
                    },
                },
            ]
        );
    };

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    return (
        <>
            {/* ─── Modal chọn gói ─── */}
            <Modal
                visible={visible && !showWebView}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <View>
                            <Text style={styles.sheetTitle}>Nâng cấp Premium</Text>
                            <Text style={styles.sheetSubtitle}>Chọn gói phù hợp với bạn</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                    </View>

                    {/* Premium perks */}
                    <View style={styles.perksRow}>
                        {['Không quảng cáo', 'Chất lượng cao', 'Offline'].map(perk => (
                            <View key={perk} style={styles.perkChip}>
                                <Ionicons name="checkmark" size={12} color={Colors.teal} />
                                <Text style={styles.perkText}>{perk}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Plans list */}
                    {isLoadingPlans ? (
                        <View style={styles.plansLoading}>
                            <ActivityIndicator color={Colors.teal} />
                            <Text style={styles.plansLoadingText}>Đang tải gói...</Text>
                        </View>
                    ) : (
                        <View style={styles.plansList}>
                            {plans.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    selected={selectedPlanId === plan.id}
                                    onPress={() => setSelectedPlanId(plan.id)}
                                />
                            ))}
                        </View>
                    )}

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={styles.ctaBtnWrapper}
                        onPress={handleCheckout}
                        disabled={isCheckingOut || !selectedPlanId || isLoadingPlans}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#7C6FEC', Colors.teal]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.ctaBtn,
                                (isCheckingOut || !selectedPlanId) && styles.ctaBtnDisabled,
                            ]}
                        >
                            {isCheckingOut ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="qr-code-outline" size={18} color="#fff" />
                                    <Text style={styles.ctaBtnText}>
                                        {selectedPlan
                                            ? `Thanh toán ${formatPrice(selectedPlan.price)}`
                                            : 'Chọn gói để tiếp tục'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.footerNote}>
                        Thanh toán qua cổng PayOS · Bảo mật & An toàn
                    </Text>
                </View>
            </Modal>

            {/* ─── Modal WebView PayOS (fullscreen) ─── */}
            <Modal
                visible={showWebView && !!paymentUrl}
                animationType="slide"
                onRequestClose={handleCloseWebView}
            >
                {paymentUrl && (
                    <PayOSWebView
                        paymentUrl={paymentUrl}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                        onClose={handleCloseWebView}
                    />
                )}
            </Modal>
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        backgroundColor: '#0D0D0D',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    handle: {
        width: 40, height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },

    // Header
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 2,
    },
    sheetSubtitle: {
        fontSize: 13,
        color: Colors.gray,
    },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },

    // Perks
    perksRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    perkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.teal + '15',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: Colors.teal + '30',
    },
    perkText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.teal,
    },

    // Plans
    plansList: {
        gap: 10,
        marginBottom: 20,
    },
    plansLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 32,
    },
    plansLoadingText: {
        fontSize: 14,
        color: Colors.gray,
    },

    // CTA
    ctaBtnWrapper: {
        marginBottom: 10,
    },
    ctaBtn: {
        height: 54,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    ctaBtnDisabled: {
        opacity: 0.5,
    },
    ctaBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    footerNote: {
        fontSize: 11,
        color: Colors.gray,
        textAlign: 'center',
    },
});
