import { Colors } from '@/constants/theme';
import { updateArtistProfileAPI, getMyArtistProfileAPI } from "@/services/artistService";
import { getPresignedUploadUrl, uploadFileToMinIO } from "@/services/storageService";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-root-toast';

const { width } = Dimensions.get('window');

const GENRES = ['Indie Pop', 'Lo-fi', 'Phonk', 'Synthwave', 'Dark Trap', 'Ambient', 'Techno', 'Rock', 'R&B', 'Hip-Hop'];

export default function ArtistSettingsScreen() {
    const router = useRouter();

    const [stageName, setStageName] = useState('');
    const [bio, setBio] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set(['Indie Pop', 'Lo-fi']));
    
    // Nơi chứa ảnh preview (nếu user sửa)
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [coverFile, setCoverFile] = useState<any>(null);

    // URL ảnh cũ từ API server
    const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Load data cũ
    useEffect(() => {
        let isMounted = true;
        const loadExistingData = async () => {
            try {
                const profile = await getMyArtistProfileAPI();
                if (!isMounted) return;
                
                if (profile.stageName) setStageName(profile.stageName);
                if (profile.bio) setBio(profile.bio);
                if (profile.avatarUrl) setExistingAvatarUrl(profile.avatarUrl);
                if (profile.coverUrl) setExistingCoverUrl(profile.coverUrl);
            } catch (e) {
                console.log('Lỗi load data nghệ sĩ cũ:', e);
                Toast.show("Fail to load artist profile.", { duration: Toast.durations.SHORT });
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        };
        loadExistingData();

        return () => { isMounted = false; };
    }, []);

    // Bật tắt thẻ Genre
    const toggleGenre = (g: string) => {
        setSelectedGenres(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    // Hàm mở thư viện ảnh chung
    const pickImageParams = async (isAvatar: boolean) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: isAvatar ? [1, 1] : [16, 9], // Cắt tỷ lệ 1:1 hoặc 16:9
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

    // Hàm xử lý Cập nhật
    const handleUpdate = async () => {
        if (!stageName) {
            return Toast.show("Please enter stage name!", { duration: Toast.durations.SHORT });
        }
        
        setIsSubmitting(true);
        try {
            let finalAvatarKey: string | undefined;
            let finalCoverKey: string | undefined;

            // Upload Avatar mới nếu có chọn
            if (avatarFile) {
                const avatarRes = await getPresignedUploadUrl(avatarFile.name, avatarFile.type, "avatars");
                await uploadFileToMinIO(avatarFile.uri, avatarFile.type, avatarRes.url);
                finalAvatarKey = avatarRes.key;
            }

            // Upload Cover mới nếu có chọn
            if (coverFile) {
                const coverRes = await getPresignedUploadUrl(coverFile.name, coverFile.type, "covers");
                await uploadFileToMinIO(coverFile.uri, coverFile.type, coverRes.url);
                finalCoverKey = coverRes.key;
            }

            const payload = {
                stageName,
                bio,
                ...(finalAvatarKey && { avatarKey: finalAvatarKey }),
                ...(finalCoverKey && { coverKey: finalCoverKey }),
            };

            await updateArtistProfileAPI(payload);

            Toast.show("Artist Profile Update Successful!", { duration: Toast.durations.SHORT });
            
            // Go back to artist portal
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile' as any);
            }
        } catch (error: any) {
            console.log("Update Error:", error);
            const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
            Toast.show("Error: " + errMsg, { duration: Toast.durations.SHORT });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.teal} />
                <Text style={{ color: Colors.gray, marginTop: 12 }}>Loading Artist Workspace...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Update Artist Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">

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

                <Text style={styles.fieldLabel}>CHANGE IMAGES</Text>
                <View style={styles.imagesContainer}>
                    {/* Avatar Box (1:1) */}
                    <TouchableOpacity style={[styles.avatarUploadBox, (avatarFile || existingAvatarUrl) && { padding: 0 }]} onPress={() => pickImageParams(true)}>
                        {avatarFile ? (
                            <Image source={{ uri: avatarFile.uri }} style={styles.avatarImagePreview} resizeMode="cover" />
                        ) : existingAvatarUrl ? (
                            <Image source={{ uri: existingAvatarUrl }} style={styles.avatarImagePreview} resizeMode="cover" />
                        ) : (
                            <>
                                <Ionicons name="person-circle-outline" size={32} color={Colors.teal} />
                                <Text style={styles.uploadTextSmall}>Avatar (1:1)</Text>
                            </>
                        )}
                        {/* Overlay Icon Edit */}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="pencil" size={14} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    {/* Cover Box (16:9) */}
                    <TouchableOpacity style={[styles.coverUploadBox, (coverFile || existingCoverUrl) && { padding: 0 }]} onPress={() => pickImageParams(false)}>
                        {coverFile ? (
                            <Image source={{ uri: coverFile.uri }} style={styles.coverImagePreview} resizeMode="cover" />
                        ) : existingCoverUrl ? (
                            <Image source={{ uri: existingCoverUrl }} style={styles.coverImagePreview} resizeMode="cover" />
                        ) : (
                            <>
                                <Ionicons name="image-outline" size={32} color={Colors.teal} />
                                <Text style={styles.uploadTextSmall}>Cover (16:9)</Text>
                            </>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="pencil" size={14} color="#FFF" />
                        </View>
                    </TouchableOpacity>
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
                    disabled={isSubmitting}
                    onPress={handleUpdate}>
                    <LinearGradient
                        colors={['#7C6FEC', '#33D294']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.nextBtn}>
                        {isSubmitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.nextBtnText}>SAVE CHANGES</Text>
                        )}
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A'
    },
    backBtn: {
        width: 44, height: 44,
        alignItems: 'flex-start', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
    },

    // Scroll
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 60,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 19,
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
        position: 'relative'
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
        position: 'relative'
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
    editIconBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#000'
    },

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
        letterSpacing: 1.5,
    },
});
