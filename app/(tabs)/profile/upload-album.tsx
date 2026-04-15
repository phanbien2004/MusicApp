import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';
import { submitAlbumAPI, submitAlbumDraftAPI } from '@/services/albumUploadService';
import { getPresignedUploadUrl, uploadFileToMinIO } from '@/services/storageService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── LOADING OVERLAY ───────────────────────────────────────────────────────────
function LoadingOverlay() {
    const pulse = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true })
        ).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={styles.loadingOverlay}>
            <Animated.View style={[styles.loadingCircleOuter, { transform: [{ rotate: spin }] }]}>
                <LinearGradient colors={['#A855F7', '#3B82F6', '#33D294']} style={styles.loadingGradientRing} />
            </Animated.View>
            <Animated.View style={[styles.loadingIconWrap, { transform: [{ scale: pulse }] }]}>
                <Ionicons name="albums-outline" size={36} color={Colors.teal} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Uploading Album</Text>
            <Text style={styles.loadingSubtitle}>Please wait while we process{'\n'}your album...</Text>
        </View>
    );
}

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────
type Step = 'form' | 'uploading' | 'done';

export default function UploadAlbumScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { lastActiveTab } = usePlayer();

    const handleBack = () => {
        const tab = lastActiveTab || 'profile';
        router.navigate(`/(tabs)/${tab}` as any);
    };

    const [step, setStep] = useState<Step>('form');
    const [albumTitle, setAlbumTitle] = useState('');
    const [artworkUri, setArtworkUri] = useState<string | null>(null);
    const [artworkFile, setArtworkFile] = useState<any>(null);
    const [dateError, setDateError] = useState<string>('');

    // Reset khi focus vào màn hình
    useFocusEffect(
        useCallback(() => {
            setStep('form');
            setAlbumTitle('');
            setArtworkUri(null);
            setArtworkFile(null);
            setDateError('');
        }, [])
    );

    const pickArtwork = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            setArtworkUri(asset.uri);
            setArtworkFile({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || 'album-cover.jpg',
            });
        }
    };

    const validateDate = (value: string): boolean => {
        // Chấp nhận YYYY-MM-DD
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(value)) {
            setDateError('Invalid date format (YYYY-MM-DD)');
            return false;
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            setDateError('Date does not exist');
            return false;
        }
        setDateError('');
        return true;
    };

    const handleUpload = async () => {
        if (!albumTitle.trim()) {
            Alert.alert('Notice', 'Please enter album title!');
            return;
        }

        setStep('uploading');
        try {
            // 1. Upload thumbnail nếu có
            let thumbnailKey: string | null = null;
            if (artworkFile) {
                const artPresigned = await getPresignedUploadUrl(
                    artworkFile.name,
                    artworkFile.type,
                    'thumbnails'
                );
                await uploadFileToMinIO(artworkFile.uri, artworkFile.type, artPresigned.url);
                thumbnailKey = artPresigned.key;
            }

            // 2. Tạo album draft
            const draft = await submitAlbumDraftAPI({
                title: albumTitle.trim(),
                thumbnailKey,
            });

            // 3. Submit album
            if(draft) {
                const response = await submitAlbumAPI(Number(draft));
                console.log(response);
                if(response === "Submitted album successfully!") {
                    setStep('done');
                    router.push({
                        pathname: '/(tabs)/profile/upload-track',
                        params: { 
                            isCreateAlbum: 'true', 
                            albumId : draft.toString(),
                            albumThumbnailKey: thumbnailKey,
                            albumTitle: albumTitle
                        }
                    });
                }
            }
        } catch (err: any) {
            console.error('[UploadAlbum] Error:', err);
            Alert.alert('Error', 'Cannot upload album at this time. Please try again.');
            setStep('form');
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top, height: 60 + insets.top }]}>
            <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 12 }]}
                onPress={handleBack}
            >
                <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
                <Text style={styles.headerStudio}>ARTIST STUDIO</Text>
                <Text style={styles.headerTitle}>CREATE ALBUM</Text>
            </View>
        </View>
    );

    if (step === 'uploading') {
        return (
            <View style={styles.safeArea}>
                {renderHeader()}
                <LoadingOverlay />
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            {renderHeader()}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Album Cover */}
                    <View style={styles.coverSection}>
                        <TouchableOpacity style={styles.coverPicker} onPress={pickArtwork} activeOpacity={0.8}>
                            {artworkUri ? (
                                <Image source={{ uri: artworkUri }} style={styles.coverImage} />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Ionicons name="image-outline" size={40} color="#444" />
                                    <Text style={styles.coverPlaceholderText}>Album Cover</Text>
                                    <Text style={styles.coverPlaceholderSub}>Tap to choose image</Text>
                                </View>
                            )}
                            {/* Edit overlay */}
                            {artworkUri && (
                                <View style={styles.coverEditOverlay}>
                                    <Ionicons name="camera-outline" size={22} color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Album Title */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ALBUM TITLE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter album name..."
                            placeholderTextColor="#444"
                            value={albumTitle}
                            onChangeText={setAlbumTitle}
                            maxLength={100}
                        />
                        <Text style={styles.charCount}>{albumTitle.length}/100</Text>
                    </View>


                    {/* Info box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.teal} />
                        <Text style={styles.infoText}>
                            After creating the album, you can add tracks to it from the album details page.
                        </Text>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, !albumTitle.trim() && styles.btnDisabled]}
                        onPress={handleUpload}
                        disabled={!albumTitle.trim()}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#7C3AED', '#A855F7', '#3B82F6']}
                            style={styles.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="albums-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.btnText}>CREATE ALBUM</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#111',
        zIndex: 10,
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitles: { alignItems: 'center' },
    headerStudio: { color: '#555', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
    headerTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

    scrollContent: { padding: 24 },

    // Cover
    coverSection: { alignItems: 'center', marginBottom: 32 },
    coverPicker: {
        width: width * 0.52,
        height: width * 0.52,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0D0D0D',
        borderWidth: 1,
        borderColor: '#222',
        // Shadow
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    coverPlaceholderText: { color: '#555', fontSize: 14, fontWeight: '700' },
    coverPlaceholderSub: { color: '#333', fontSize: 11 },
    coverEditOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 44,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Form
    formGroup: { marginBottom: 24 },
    label: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 1 },
    input: {
        backgroundColor: '#080808',
        borderWidth: 1,
        borderColor: '#1E1E1E',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 15,
        color: '#FFF',
        fontSize: 14,
        flex: 1,
    },
    inputError: { borderColor: '#EF4444' },
    charCount: { color: '#333', fontSize: 11, textAlign: 'right', marginTop: 6 },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dateIcon: { marginLeft: 4 },
    dateInput: { flex: 1 },
    hintText: { color: '#333', fontSize: 11, marginTop: 6 },
    errorText: { color: '#EF4444', fontSize: 11, marginTop: 6 },

    // Info box
    infoBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'rgba(51, 210, 148, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(51, 210, 148, 0.15)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 28,
        alignItems: 'flex-start',
    },
    infoText: { color: '#666', fontSize: 12, flex: 1, lineHeight: 18 },

    // CTA Button
    submitBtn: { borderRadius: 30, overflow: 'hidden', marginTop: 4 },
    btnDisabled: { opacity: 0.4 },
    gradient: {
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    // Loading
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    loadingCircleOuter: { width: 100, height: 100, borderRadius: 50, position: 'absolute' },
    loadingGradientRing: { width: 100, height: 100, borderRadius: 50, opacity: 0.3 },
    loadingIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#080808',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E1E1E',
    },
    loadingTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 100 },
    loadingSubtitle: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
