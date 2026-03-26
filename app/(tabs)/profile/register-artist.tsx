import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { getPresignedUploadUrl, uploadFileToMinIO } from "@/services/storageService";
import { createArtistProfileAPI } from "@/services/artistService";

const { width } = Dimensions.get('window');

const GENRES = ['Indie Pop', 'Lo-fi', 'Phonk', 'Synthwave', 'Dark Trap', 'Ambient', 'Techno', 'Rock', 'R&B', 'Hip-Hop'];

// ─── Step indicator ───────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
    const infoActive = step === 0;
    const verifyActive = step === 1;
    return (
        <View style={stepStyles.container}>
            {/* Step 1 */}
            <View style={[stepStyles.stepChip, infoActive && stepStyles.stepChipActive]}>
                <View style={[stepStyles.dot, infoActive && stepStyles.dotActive]}>
                    <Text style={stepStyles.dotNum}>1</Text>
                </View>
                <Text style={[stepStyles.stepLabel, infoActive && stepStyles.stepLabelActive]}>Info</Text>
            </View>
            <View style={stepStyles.line} />
            {/* Step 2 */}
            <View style={[stepStyles.stepChip, verifyActive && stepStyles.stepChipActive]}>
                <View style={[stepStyles.dot, verifyActive && stepStyles.dotActive]}>
                    <Text style={stepStyles.dotNum}>2</Text>
                </View>
                <Text style={[stepStyles.stepLabel, verifyActive && stepStyles.stepLabelActive]}>Verify</Text>
            </View>
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    stepChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepChipActive: {},
    dot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#2A2A2A',
        alignItems: 'center', justifyContent: 'center',
    },
    dotActive: { backgroundColor: Colors.teal },
    dotNum: { fontSize: 11, fontWeight: '800', color: Colors.white },
    stepLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray },
    stepLabelActive: { color: Colors.teal },
    line: { flex: 0, height: 1.5, backgroundColor: '#2A2A2A', width: 20 },
});


// ─── Main Component ───────────────────────────────────────────────
export default function RegisterArtistScreen() {
    const router = useRouter();
    const [step, setStep] = useState(0); // 0=info (stage+bio+genres), 1=verify
    const [stageName, setStageName] = useState('');
    const [bio, setBio] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set(['Indie Pop', 'Lo-fi']));
    // ─── Tách thành 2 State cho Ảnh ───
    const [agreed, setAgreed] = useState(false);
    const [avatarFile, setAvatarFile] = useState<any>(null); // Avatar (1:1)
    const [coverFile, setCoverFile] = useState<any>(null);   // Cover (16:9)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bật tắt thẻ Genre
    const toggleGenre = (g: string) => {
        setSelectedGenres(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    // Hàm mở thư viện ảnh chung
    // isAvatar = true -> Cắt tỉ lệ 1:1. isAvatar = false -> Cắt tỷ lệ 16:9
    const pickImageParams = async (isAvatar: boolean) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: isAvatar ? [1, 1] : [16, 9], // Ép cắt ảnh tùy theo khung
            quality: 0.8,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            const fileObj = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `${isAvatar ? 'avatar' : 'cover'}-${Date.now()}.jpg`
            };
            if (isAvatar) setAvatarFile(fileObj);
            else setCoverFile(fileObj);
        }
    };

    // Hàm xử lý Submit Toàn Bộ
    const handleSubmit = async () => {
        if (!agreed) return Alert.alert("Cảnh báo", "Bạn cần đồng ý với điều khoản!");
        if (!stageName || !avatarFile || !coverFile) return Alert.alert("Cảnh báo", "Vui lòng nhập tên và chọn ĐỦ CẢ 2 ẢNH!");
        
        setIsSubmitting(true);
        try {
            console.log("=> Xin Presigned URL cho Avatar và Cover...");
            // Xin Link song song cho nhanh (hoặc tuần tự nếu muốn)
            const [avatarRes, coverRes] = await Promise.all([
                getPresignedUploadUrl(avatarFile.name, avatarFile.type, "avatars"),
                getPresignedUploadUrl(coverFile.name, coverFile.type, "covers")
            ]);

            console.log("=> Đang đẩy 2 File lên MinIO...");
            await Promise.all([
                uploadFileToMinIO(avatarFile.uri, avatarFile.type, avatarRes.url),
                uploadFileToMinIO(coverFile.uri, coverFile.type, coverRes.url)
            ]);

            console.log("=> Hoàn tất MinIO! Tạo hồ sơ Nghệ sĩ Backend...");
            const responseData = await createArtistProfileAPI({
                stageName: stageName,
                bio: bio,
                avatarKey: avatarRes.key, // Lấy đúng Key của từng ảnh gửi xuống
                coverKey: coverRes.key
            });
            console.log("=> Request Thành Công:", responseData);
            Alert.alert("Thành công!", "Đã gửi yêu cầu đăng ký Nghệ sĩ.");
            router.back();
        } catch (error: any) {
            console.log("=> Lỗi đăng ký:", error);
            const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
            Alert.alert("Lỗi", "Chi tiết lỗi: " + errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => step === 0 ? router.back() : setStep(0)}>
                        <Ionicons name="chevron-back" size={20} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Artist Portal</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.stepBarWrapper}>
                    <StepBar step={step} />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">

                {/* ══════════════════════════
                    STEP 0 — Info (Stage + Bio + Genres)
                ══════════════════════════ */}
                {step === 0 && (
                    <>
                        <Text style={styles.joinText}>JOIN THE</Text>
                        <LinearGradient
                            colors={['#33D294', '#7C6FEC']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.gradientTextWrapper}>
                            <Text style={styles.gradientTitle}>CREATOR COMMUNITY</Text>
                        </LinearGradient>
                        <Text style={styles.subtitle}>
                            Claim your profile, upload your tracks, and start your journey.
                        </Text>

                        <Text style={styles.fieldLabel}>STAGE NAME</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Bien Ne"
                                placeholderTextColor={Colors.gray}
                                value={stageName}
                                onChangeText={setStageName}
                            />
                        </View>

                        <Text style={styles.fieldLabel}>ARTIST BIO</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                placeholder="Tell your story..."
                                placeholderTextColor={Colors.gray}
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>

                        <Text style={styles.fieldLabel}>PRIMARY GENRES</Text>
                        <Text style={[styles.subtitle, { marginBottom: 12 }]}>Choose all that describe your music.</Text>
                        <View style={styles.genresGrid}>
                            {GENRES.map(genre => {
                                const active = selectedGenres.has(genre);
                                return (
                                    <TouchableOpacity
                                        key={genre}
                                        style={[styles.genreChip, active && styles.genreChipActive]}
                                        onPress={() => toggleGenre(genre)}>
                                        <Text style={[styles.genreText, active && styles.genreTextActive]}>
                                            {genre}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={styles.nextBtnWrapper}
                            activeOpacity={0.85}
                            onPress={() => setStep(1)}>
                            <LinearGradient
                                colors={['#7C6FEC', '#33D294']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.nextBtn}>
                                <Text style={styles.nextBtnText}>CONTINUE TO VERIFY</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}

                {/* ══════════════════════════
                    STEP 1 — Verify
                ══════════════════════════ */}
                {step === 1 && (
                    <>
                        <Text style={styles.joinText}>VERIFY YOUR</Text>
                        <LinearGradient
                            colors={['#33D294', '#7C6FEC']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.gradientTextWrapper}>
                            <Text style={styles.gradientTitle}>IDENTITY</Text>
                        </LinearGradient>
                        <Text style={styles.subtitle}>
                            Help us protect our community by confirming your details.
                        </Text>

                        <Text style={styles.fieldLabel}>CHOOSE IMAGES</Text>

                        <View style={styles.imagesContainer}>
                            {/* Avatar Box (1:1) */}
                            <TouchableOpacity style={[styles.avatarUploadBox, avatarFile && { padding: 0 }]} onPress={() => pickImageParams(true)}>
                                {avatarFile ? (
                                    <Image source={{ uri: avatarFile.uri }} style={styles.avatarImagePreview} resizeMode="cover" />
                                ) : (
                                    <>
                                        <Ionicons name="person-circle-outline" size={32} color={Colors.teal} />
                                        <Text style={styles.uploadTextSmall}>Avatar (1:1)</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Cover Box (16:9) */}
                            <TouchableOpacity style={[styles.coverUploadBox, coverFile && { padding: 0 }]} onPress={() => pickImageParams(false)}>
                                {coverFile ? (
                                    <Image source={{ uri: coverFile.uri }} style={styles.coverImagePreview} resizeMode="cover" />
                                ) : (
                                    <>
                                        <Ionicons name="image-outline" size={32} color={Colors.teal} />
                                        <Text style={styles.uploadTextSmall}>Cover (16:9)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Terms */}
                        <View style={styles.termsCard}>
                            <View style={styles.termsHeader}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.teal} />
                                <Text style={styles.termsMain}>
                                    By submitting, you agree to our Artist Content Policy and intellectual property terms.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.checkRow}
                                onPress={() => setAgreed(!agreed)}>
                                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                                    {agreed && <Ionicons name="checkmark" size={13} color="#000" />}
                                </View>
                                <Text style={styles.checkLabel}>I Confirm My Rights</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.nextBtnWrapper}
                            activeOpacity={0.85}
                            disabled={isSubmitting}
                            onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#7C6FEC', '#33D294']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.nextBtn}>
                                <Text style={styles.nextBtnText}>
                                    {isSubmitting ? "ĐANG TIẾN HÀNH..." : "SUBMIT"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}

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

    // Header
    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepBarWrapper: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
        textAlign: 'center',
    },

    // Scroll
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 60,
    },

    // Titles
    joinText: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.white,
        marginTop: 4,
        letterSpacing: 1,
    },
    gradientTextWrapper: {
        alignSelf: 'flex-start',
        borderRadius: 4,
        marginBottom: 10,
    },
    gradientTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: 1,
        paddingHorizontal: 2,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 19,
        marginBottom: 24,
    },

    // Form fields
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 4,
    },
    inputWrapper: { marginBottom: 20 },
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
    textarea: {
        height: 120,
        paddingTop: 14,
    },

    // Genres
    genresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
        marginTop: 8,
    },
    genreChip: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 24,
        backgroundColor: '#1A1A1A',
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
    },
    genreChipActive: {
        backgroundColor: Colors.teal + '22',
        borderColor: Colors.teal,
    },
    genreText: { fontSize: 13, fontWeight: '600', color: Colors.gray },
    genreTextActive: { color: Colors.teal },

    // Upload
    imagesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20,
    },
    avatarUploadBox: {
        flex: 0.35,
        aspectRatio: 1, // Vuông 1:1
        borderWidth: 1.5,
        borderColor: Colors.teal,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F2D2420',
        padding: 10,
    },
    coverUploadBox: {
        flex: 0.65,
        aspectRatio: 16/9, // Hình chữ nhật 16:9
        borderWidth: 1.5,
        borderColor: Colors.teal,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F2D2420',
        padding: 10,
    },
    avatarImagePreview: { width: '100%', height: '100%', borderRadius: 14 },
    coverImagePreview: { width: '100%', height: '100%', borderRadius: 14 },
    uploadTextSmall: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.teal,
        marginTop: 6,
        textAlign: 'center',
    },

    // Terms card
    termsCard: {
        backgroundColor: '#111',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        padding: 16,
        gap: 14,
        marginBottom: 28,
    },
    termsHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    termsMain: {
        flex: 1,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 19,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 1.5, borderColor: '#444',
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    checkLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },

    // Button
    nextBtnWrapper: { width: '100%' },
    nextBtn: {
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 2,
    },
});
