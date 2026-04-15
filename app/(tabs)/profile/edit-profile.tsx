import { usePlayer } from '@/context/player-context';
import { Colors } from '@/constants/theme';
import { getMySubscriptionAPI, MySubscriptionResponse } from '@/services/paymentService';
import { updateProfileAPI } from "@/services/profileService";
import { getPresignedUploadUrl, uploadFileToMinIO } from "@/services/storageService";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-root-toast';

function formatSubscriptionDate(date?: string | null) {
    if (!date) return '--/--/----';
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
}

function formatPrice(price?: number) {
    return `${(price ?? 0).toLocaleString('vi-VN')} VND`;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { lastActiveTab } = usePlayer();

    const handleBack = () => {
        const tab = lastActiveTab || 'profile';
        router.navigate(`/(tabs)/${tab}` as any);
    };
    
    // Khởi tạo state từ tham số truyền vào
    const [displayName, setDisplayName] = useState((params.name as string) || '');
    const [avatarFile, setAvatarFile] = useState<any>(null); // Ảnh mới user vừa chọn
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscription, setSubscription] = useState<MySubscriptionResponse | null>(null);
    const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

    // Ảnh hiển thị (ưu tiên ảnh mới chọn, nếu không có thì lấy ảnh cũ từ params)
    const currentPreviewUrl = avatarFile ? avatarFile.uri : (params.avatar as string);
    const isPremiumActive =
        Boolean(subscription?.isActive) &&
        subscription?.subscriptionType === 'PREMIUM';

    const loadSubscription = useCallback(async () => {
        setIsLoadingSubscription(true);
        try {
            const response = await getMySubscriptionAPI();
            setSubscription(response);
        } catch (error) {
            console.log('=> Load subscription error:', error);
            setSubscription(null);
        } finally {
            setIsLoadingSubscription(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSubscription();
        }, [loadSubscription])
    );

    // Hàm chọn ảnh mới
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1], // Ép cắt 1:1 cho avatar
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setAvatarFile({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `avatar-${Date.now()}.jpg`
            });
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            return Toast.show("Please enter display name!", { duration: Toast.durations.SHORT });
        }

        setIsSubmitting(true);
        try {
            let finalAvatarKey = null;

            // Nếu user có chọn ảnh mới -> Phải up lên MinIO
            if (avatarFile) {
                console.log("=> Requesting Presigned link for new Avatar...");
                const avatarRes = await getPresignedUploadUrl(avatarFile.name, avatarFile.type, "avatars");
                
                console.log("=> Uploading new Avatar to MinIO...");
                console.log(avatarFile.type);
                await uploadFileToMinIO(avatarFile.uri, avatarFile.type, avatarRes.url);
                
                finalAvatarKey = avatarRes.key;
            }

            console.log("=> Calling Update Account API...");
            const responseData = await updateProfileAPI({
                displayName: displayName,
                avatarKey: finalAvatarKey // LƯU Ý: Nếu gửi null, báo Backend bỏ qua không cập nhật avatarKey
            });

            console.log("=> Success:", responseData);
            Toast.show("Profile updated successfully!", { duration: Toast.durations.SHORT });
            handleBack();
            
        } catch (error: any) {
            console.log("=> Update error:", error);
            const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
            Toast.show("Update failed: " + errMsg, { duration: Toast.durations.SHORT });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* AVATAR UPLOAD */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity
                        onPress={pickImage}
                        style={[styles.avatarWrapper, isPremiumActive && styles.avatarWrapperPremium]}
                    >
                        {currentPreviewUrl ? (
                            <Image 
                                source={{ uri: currentPreviewUrl }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={50} color={Colors.gray} />
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={16} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarPrompt}>Tap to change avatar</Text>
                </View>

                <View style={[styles.subscriptionCard, isPremiumActive && styles.subscriptionCardActive]}>
                    <View style={styles.subscriptionTopRow}>
                        <View style={styles.subscriptionIconWrap}>
                            {isLoadingSubscription ? (
                                <ActivityIndicator size="small" color="#FFD700" />
                            ) : (
                                <Ionicons
                                    name={isPremiumActive ? "diamond" : "diamond-outline"}
                                    size={18}
                                    color={isPremiumActive ? "#FFD700" : Colors.gray}
                                />
                            )}
                        </View>

                        <View style={styles.subscriptionContent}>
                            <Text style={styles.subscriptionLabel}>SUBSCRIPTION</Text>
                            <Text style={styles.subscriptionTitle}>
                                {isPremiumActive ? subscription?.planName || 'Premium' : 'Free Account'}
                            </Text>
                            <Text style={styles.subscriptionSubtitle}>
                                {isPremiumActive
                                    ? `Goi ${subscription?.subscriptionType} dang hoat dong`
                                    : 'Tai khoan cua ban hien chua co goi Premium'}
                            </Text>
                        </View>

                        {isPremiumActive ? (
                            <View style={styles.activeBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#0B2319" />
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                            </View>
                        ) : null}
                    </View>

                    {isPremiumActive ? (
                        <>
                            <View style={styles.subscriptionDivider} />

                            <View style={styles.subscriptionMetaGrid}>
                                <View style={styles.subscriptionMetaItem}>
                                    <Text style={styles.subscriptionMetaLabel}>Price</Text>
                                    <Text style={styles.subscriptionMetaValue}>
                                        {formatPrice(subscription?.price)}
                                    </Text>
                                </View>
                                <View style={styles.subscriptionMetaItem}>
                                    <Text style={styles.subscriptionMetaLabel}>Start</Text>
                                    <Text style={styles.subscriptionMetaValue}>
                                        {formatSubscriptionDate(subscription?.startDate)}
                                    </Text>
                                </View>
                                <View style={styles.subscriptionMetaItem}>
                                    <Text style={styles.subscriptionMetaLabel}>End</Text>
                                    <Text style={styles.subscriptionMetaValue}>
                                        {formatSubscriptionDate(subscription?.endDate)}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.subscriptionAction}
                                onPress={() => router.push('/(tabs)/profile/my-subscription' as any)}
                            >
                                <Text style={styles.subscriptionActionText}>View subscription</Text>
                                <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                            </TouchableOpacity>
                        </>
                    ) : null}
                </View>

                {/* FORM FIELDS */}
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={Colors.gray}
                        value={displayName}
                        onChangeText={setDisplayName}
                    />
                </View>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                    style={styles.saveBtnWrapper}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    onPress={handleSave}>
                    <LinearGradient
                        colors={['#7C6FEC', '#33D294']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>
                            {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A'
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 60,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarWrapperPremium: {
        borderWidth: 2,
        borderColor: '#FACC15',
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 6,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#2A2A2A'
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.teal,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000'
    },
    avatarPrompt: {
        marginTop: 12,
        fontSize: 13,
        color: Colors.gray,
    },
    subscriptionCard: {
        backgroundColor: '#101010',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#202020',
        padding: 16,
        marginBottom: 26,
        gap: 14,
    },
    subscriptionCardActive: {
        backgroundColor: '#12100A',
        borderColor: '#4A3A0B',
    },
    subscriptionTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    subscriptionIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subscriptionContent: {
        flex: 1,
        gap: 2,
    },
    subscriptionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.4,
    },
    subscriptionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.white,
    },
    subscriptionSubtitle: {
        fontSize: 12,
        color: Colors.grayLight,
        lineHeight: 18,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#B7F7D1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0B2319',
        letterSpacing: 1,
    },
    subscriptionDivider: {
        height: 1,
        backgroundColor: '#2A2A2A',
    },
    subscriptionMetaGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    subscriptionMetaItem: {
        flex: 1,
        backgroundColor: '#171717',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#242424',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
    },
    subscriptionMetaLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1,
    },
    subscriptionMetaValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.white,
    },
    subscriptionAction: {
        height: 44,
        borderRadius: 12,
        backgroundColor: '#191919',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subscriptionActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.white,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    inputWrapper: { marginBottom: 30 },
    input: {
        width: '100%',
        height: 52,
        backgroundColor: '#111',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        paddingHorizontal: 16,
        color: Colors.white,
        fontSize: 15,
    },
    saveBtnWrapper: { width: '100%', marginTop: 10 },
    saveBtn: {
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 1.5,
    },
});
