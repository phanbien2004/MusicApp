import { Colors } from '@/constants/theme';
import { ArtistContentType, searchAPI } from '@/services/searchService';
import { getPresignedUploadUrl, uploadFileToMinIO } from '@/services/storageService';
import {
    FeaturedArtistDTO,
    SubmitDraftResponse,
    TagDTO,
    contributorDTO,
    getAllTagsAPI,
    submitDraftAPI,
    submitFinalizeAPI,
} from '@/services/trackService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Interface mới để quản lý vai trò ---
interface SelectedContributor {
    artist: ArtistContentType;
    role: 'PRODUCER' | 'FEATURED';
}

const getAudioDuration = (uri: string): Promise<number> => {
    return new Promise((resolve) => {
        const player = createAudioPlayer({ uri });
        const TIMEOUT = 5000;
        let attempts = 0;
        const check = setInterval(() => {
            attempts++;
            const dur = player.duration;
            if (dur && dur > 0) {
                clearInterval(check);
                player.remove();
                resolve(Math.round(dur));
            } else if (attempts * 200 >= TIMEOUT) {
                clearInterval(check);
                player.remove();
                resolve(0);
            }
        }, 200);
    });
};

type Step = 'form' | 'uploading' | 'review';

// ─── LOADING OVERLAY ───────────────────────────────────────────────────────────
function LoadingOverlay() {
    const pulse = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true })).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={styles.loadingOverlay}>
            <Animated.View style={[styles.loadingCircleOuter, { transform: [{ rotate: spin }] }]}>
                <LinearGradient colors={['#A855F7', '#3B82F6', '#33D294']} style={styles.loadingGradientRing} />
            </Animated.View>
            <Animated.View style={[styles.loadingIconWrap, { transform: [{ scale: pulse }] }]}>
                <Ionicons name="cloud-upload-outline" size={36} color={Colors.teal} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Uploading Track</Text>
            <Text style={styles.loadingSubtitle}>Please wait while we process{'\n'}your music...</Text>
        </View>
    );
}

// ─── CHOOSE TAG MODAL ──────────────────────────────────────────────────────────
interface ChooseTagModalProps {
    visible: boolean;
    currentSelected: TagDTO[];
    recommendedTags: TagDTO[];
    allSystemTags: TagDTO[];
    onDone: (tags: TagDTO[]) => void;
    onClose: () => void;
}

function ChooseTagModal({ visible, currentSelected, recommendedTags, allSystemTags, onDone, onClose }: ChooseTagModalProps) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<TagDTO[]>(currentSelected);

    useEffect(() => {
        if (visible) setSelected(currentSelected);
    }, [visible, currentSelected]);

    const otherTags = allSystemTags.filter(sys => !recommendedTags.find(r => r.id === sys.id));
    const allTagObjects = [...recommendedTags, ...otherTags];

    const toggleTag = (tag: TagDTO) => {
        const exists = selected.find(t => t.id === tag.id);
        if (exists) {
            setSelected(selected.filter(t => t.id !== tag.id));
        } else if (selected.length < 3) {
            setSelected([...selected, tag]);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={[styles.modalHeader, { paddingTop: insets.top, height: 60 + insets.top }]}>
                        <TouchableOpacity onPress={onClose} style={styles.modalBackBtn}>
                            <Ionicons name="close" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderTitles}>
                            <Text style={styles.modalHeaderStudio}>CHOOSE VIBE</Text>
                            <Text style={styles.modalHeaderTitle}>TAG YOUR MUSIC</Text>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.choiceRowHeader}>
                            <Text style={styles.modalLabel}>CURRENT SELECTION {selected.length}/3</Text>
                        </View>

                        <View style={styles.tagWrap}>
                            {selected.map(tag => (
                                <TouchableOpacity key={tag.id} style={styles.tagSelected} onPress={() => toggleTag(tag)}>
                                    <Text style={styles.tagSelectedText}>{tag.displayName}</Text>
                                    <Ionicons name="close-circle" size={16} color={Colors.teal} style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalDivider} />

                        {recommendedTags && recommendedTags.length > 0 && (
                            <>
                                <View style={styles.choiceRowHeader}>
                                    <Text style={styles.modalLabel}><Ionicons name="sparkles" size={14} color="#A855F7" /> AI SUGGESTED</Text>
                                </View>
                                <View style={styles.tagWrap}>
                                    {recommendedTags.filter(t => !selected.find(s => s.id === t.id)).map(tag => (
                                        <TouchableOpacity 
                                            key={tag.id} 
                                            style={[styles.tagUnselected, { borderColor: '#A855F7' }, selected.length >= 3 && styles.tagDisabled]} 
                                            onPress={() => toggleTag(tag)}
                                            disabled={selected.length >= 3}
                                        >
                                            <Text style={styles.tagUnselectedText}>{tag.displayName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.modalDivider} />
                            </>
                        )}
                        <View style={styles.choiceRowHeader}>
                            <Text style={styles.modalLabel}>ALL VIBES</Text>
                        </View>
                        <View style={styles.tagWrap}>
                            {allTagObjects.filter(t => !selected.find(s => s.id === t.id)).map(tag => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[styles.tagUnselected, selected.length >= 3 && styles.tagDisabled]}
                                    onPress={() => toggleTag(tag)}
                                    disabled={selected.length >= 3}
                                >
                                    <Text style={styles.tagUnselectedText}>{tag.displayName}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.modalOkBtn} onPress={() => onDone(selected)}>
                            <Text style={styles.modalOkText}>CONFIRM</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── REVIEW AUDIO CARD ────────────────────────────────────────────────────────
function ReviewAudioCard({ trackUrl, trackTitle, thumbnailUrl, durationStr, sizeStr, duration: calculatedDuration }: any) {
    const player = useAudioPlayer({ uri: trackUrl });
    const status = useAudioPlayerStatus(player);
    // Tạo sóng âm Pseudo-random xen kẽ để nhìn tự nhiên và chuẩn đồ thị tần số hơn
    const waveHeights = React.useMemo(() => {
        return Array.from({ length: 48 }, (_, i) => {
            const h1 = Math.sin(i * 0.3) * 15;
            const h2 = Math.cos(i * 0.7) * 10;
            const randomPeak = Math.random() > 0.8 ? 15 : 0;
            return Math.max(5, Math.min(50, 20 + h1 + h2 + randomPeak + Math.random() * 5));
        });
    }, [trackTitle]);

    const finalDuration = status.duration > 0 ? status.duration : (calculatedDuration > 0 ? calculatedDuration : 1);
    const [dragTime, setDragTime] = useState<number | null>(null);
    const progressPercent = Math.min(((dragTime !== null ? dragTime : status.currentTime) / finalDuration) * 100, 100) + '%';
    const barWidth = useRef<number>(0);

    const handleSeekUpdate = (e: any) => {
        if (barWidth.current > 0) {
            const ratio = e.nativeEvent.locationX / barWidth.current;
            const targetTime = Math.max(0, Math.min(ratio * finalDuration, finalDuration));
            setDragTime(targetTime);
        }
    };

    const handleSeekEnd = (e: any) => {
        if (barWidth.current > 0) {
            const ratio = e.nativeEvent.locationX / barWidth.current;
            const targetTime = Math.max(0, Math.min(ratio * finalDuration, finalDuration));
            player.seekTo(targetTime);
            setDragTime(null);
        }
    };

    return (
        <View style={styles.audioCard}>
            <View style={styles.trackInfoRow}>
                {thumbnailUrl ? <Image source={{ uri: thumbnailUrl }} style={styles.trackThumb} /> : <View style={[styles.trackThumb, { backgroundColor: '#222' }]} />}
                <View style={{ flex: 1 }}>
                    <Text style={styles.trackName} numberOfLines={1}>{trackTitle}</Text>
                    <Text style={styles.trackSize}>{sizeStr}</Text>
                </View>
            </View>

            <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
            <View style={styles.waveformContainer}>
                {waveHeights.map((h, i) => (
                    <View key={i} style={[styles.waveBar, { height: h, backgroundColor: (i / 48) <= (status.currentTime / finalDuration) ? Colors.teal : '#2A2A2A' }]} />
                ))}
            </View>
                <View style={styles.playerControls}>
                    <TouchableOpacity style={styles.playPauseBtn} onPress={() => status.playing ? player.pause() : player.play()}>
                        <Ionicons name={status.playing ? "pause" : "play"} size={22} color={Colors.teal} />
                    </TouchableOpacity>
                    <View style={styles.sliderWrap}>
                        <View 
                            style={styles.progressBarWrapper} 
                            onLayout={(e) => barWidth.current = e.nativeEvent.layout.width}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderGrant={handleSeekUpdate}
                            onResponderMove={handleSeekUpdate}
                            onResponderRelease={handleSeekEnd}
                        >
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: progressPercent as any }]} />
                                <View style={[styles.progressKnob, { left: progressPercent as any }]} />
                            </View>
                        </View>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatDuration(Math.floor(dragTime !== null ? dragTime : status.currentTime))} / {durationStr}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function UploadTrackScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState<Step>('form');
    const [artworkUri, setArtworkUri] = useState<string | null>(null);
    const [artworkFile, setArtworkFile] = useState<any>(null);
    const [trackFile, setTrackFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [trackTitle, setTrackTitle] = useState('');

    const [artistQuery, setArtistQuery] = useState('');
    const [artistResults, setArtistResults] = useState<ArtistContentType[]>([]);

    // --- Thay đổi state selectedArtists để lưu cả Role ---
    const [selectedContributors, setSelectedContributors] = useState<SelectedContributor[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [draftData, setDraftData] = useState<SubmitDraftResponse | null>(null);
    const [reviewArtists, setReviewArtists] = useState<FeaturedArtistDTO[]>([]);
    const [reviewTags, setReviewTags] = useState<TagDTO[]>([]);
    const [allSystemTags, setAllSystemTags] = useState<TagDTO[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [calculatedDuration, setCalculatedDuration] = useState(0);

    useEffect(() => {
        getAllTagsAPI().then(setAllSystemTags).catch(e => console.error("Load tags failed:", e));
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (artistQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    const res = await searchAPI({ keyword: artistQuery, type: 'artists', pageNumber: 1, pageSize: 5 });
                    setArtistResults(res.artistPreviewDTOS?.content || []);
                } catch (e) { console.error('Search error:', e); } finally { setIsSearching(false); }
            } else { setArtistResults([]); }
        }, 500);
        return () => clearTimeout(timer);
    }, [artistQuery]);

    // --- Hàm add artist với Role cụ thể ---
    const addContributor = (artist: ArtistContentType, role: 'PRODUCER' | 'FEATURED') => {
        if (!selectedContributors.find(c => c.artist.id === artist.id)) {
            setSelectedContributors([...selectedContributors, { artist, role }]);
        }
        setArtistQuery('');
        setArtistResults([]);
    };

    const pickArtwork = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
        if (!result.canceled) {
            const asset = result.assets[0];
            setArtworkUri(asset.uri);
            setArtworkFile({ uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || 'artwork.jpg' });
        }
    };

    const pickTrack = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'] });
        if (!result.canceled && result.assets) setTrackFile(result.assets[0]);
    };

    const handleUpload = async () => {
        if (!trackFile || !trackTitle.trim()) {
            Alert.alert('Thông báo', 'Vui lòng điền đủ tên bài hát và chọn file nhạc!');
            return;
        }
        setStep('uploading');
        try {
            const trackPresigned = await getPresignedUploadUrl(trackFile.name, trackFile.mimeType || 'audio/mpeg', 'songs');
            await uploadFileToMinIO(trackFile.uri, trackFile.mimeType || 'audio/mpeg', trackPresigned.url);

            let thumbnailKey = null;
            if (artworkFile) {
                const artPresigned = await getPresignedUploadUrl(artworkFile.name, artworkFile.type, 'thumbnails');
                await uploadFileToMinIO(artworkFile.uri, artworkFile.type, artPresigned.url);
                thumbnailKey = artPresigned.key;
            }

            const duration = await getAudioDuration(trackFile.uri);
            setCalculatedDuration(duration);

            const draft = await submitDraftAPI({
                title: trackTitle.trim(),
                trackKey: trackPresigned.key,
                thumbnailKey,
                duration,
                featuredArtistDTO: selectedContributors.map(c => ({
                    id: c.artist.id,
                    role: c.role
                })),
            });

            setDraftData(draft);
            setReviewArtists(draft.featuredArtists || []);
            setReviewTags(draft.recommendedTags ? draft.recommendedTags.slice(0, 3) : []);
            setStep('review');
        } catch (err: any) {
            console.error('Upload error:', err);
            Alert.alert('Lỗi upload', 'Không thể tải bài hát lên lúc này.');
            setStep('form');
        }
    };

    const handleFinalize = async () => {
        if (!draftData) return;
        setIsFinalizing(true);
        try {
            // --- TẠO DANH SÁCH CONTRIBUTORS THEO CÁCH 2 ---
            const finalContributors: contributorDTO[] = selectedContributors.map(c => ({
                id: Number(c.artist.id),
                role: c.role
            }));
            // Việc gán người upload (Owner) làm chủ đã được Backend đảm nhận tự động và bảo mật.

            await submitFinalizeAPI({
                id: draftData.trackId,
                contributors: finalContributors, // Gửi list contributor kèm role
                tagIds: reviewTags.map(t => t.id),
            });

            Alert.alert(
                "Tác phẩm đã được gửi",
                "Bài hát của bạn đang được kiểm tra kỹ thuật. Chúng tôi sẽ thông báo cho bạn ngay khi mọi thứ sẵn sàng.",
                [{ text: 'Đồng ý', onPress: () => router.back() }]
            );
        } catch (err: any) {
            Alert.alert('Lỗi', 'Giai đoạn hoàn tất gặp lỗi.');
        } finally { setIsFinalizing(false); }
    };

    const renderHeader = (title: string) => (
        <View style={[styles.header, { paddingTop: insets.top, height: 60 + insets.top }]}>
            <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => step === 'review' ? setStep('form') : router.back()}>
                <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
                <Text style={styles.headerStudio}>ARTIST STUDIO</Text>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
        </View>
    );

    if (step === 'uploading') {
        return <View style={styles.safeArea}>{renderHeader('UPLOAD TRACK')}<LoadingOverlay /></View>;
    }

    if (step === 'review' && draftData) {
        return (
            <View style={styles.safeArea}>
                {renderHeader('UPLOAD TRACK')}
                <ChooseTagModal
                    visible={showTagModal}
                    currentSelected={reviewTags}
                    recommendedTags={draftData.recommendedTags}
                    allSystemTags={allSystemTags}
                    onDone={(tags) => { setReviewTags(tags); setShowTagModal(false); }}
                    onClose={() => setShowTagModal(false)}
                />
                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
                    <Text style={styles.reviewSectionTitle}>REVIEW YOUR TRACK</Text>
                    <ReviewAudioCard
                        trackUrl={draftData.trackUrl}
                        trackTitle={draftData.title}
                        thumbnailUrl={draftData.thumbnailUrl || artworkUri}
                        durationStr={formatDuration(calculatedDuration)}
                        sizeStr={`${(trackFile!.size! / (1024 * 1024)).toFixed(1)} MB`}
                        duration={calculatedDuration}
                    />

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.reviewLabel}>Contributors</Text>
                    </View>
                    <View style={styles.artistsRow}>
                        {selectedContributors.map(c => (
                            <View key={c.artist.id} style={styles.artistItem}>
                                {c.artist.avatarUrl ? <Image source={{ uri: c.artist.avatarUrl }} style={styles.artistAvatar} /> : <View style={[styles.artistAvatar, { backgroundColor: '#333' }]} />}
                                <Text style={styles.artistLabel} numberOfLines={1}>{c.artist.name}</Text>
                                <Text style={styles.roleLabelSmall}>{c.role}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.reviewLabel}>VIBE TAGS ({reviewTags.length}/3)</Text>
                        <TouchableOpacity onPress={() => setShowTagModal(true)}><Ionicons name="pencil-outline" size={18} color="#666" /></TouchableOpacity>
                    </View>
                    <View style={styles.tagWrap}>
                        {reviewTags.map(tag => (
                            <TouchableOpacity key={tag.id} style={styles.tagPillReview} onPress={() => setReviewTags(reviewTags.filter(t => t.id !== tag.id))}>
                                <Text style={styles.tagPillText}>{tag.displayName}</Text>
                                <Ionicons name="close" size={14} color={Colors.teal} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.submitBtn, isFinalizing && { opacity: 0.6 }]} onPress={handleFinalize} disabled={isFinalizing}>
                        <LinearGradient colors={['#A855F7', '#3B82F6']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {isFinalizing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>DONE</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            {renderHeader('UPLOAD TRACK')}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* File & Artwork input (giữ nguyên) */}
                    <TouchableOpacity style={styles.dropZone} onPress={pickTrack} activeOpacity={0.8}>
                        <Ionicons name="cloud-upload-outline" size={42} color={Colors.teal} />
                        <Text style={styles.dropTitle}>{trackFile ? trackFile.name : 'Select track file'}</Text>
                        <Text style={styles.dropSubtitle}>MP3, WAV, FLAC (MAX 50MB)</Text>
                    </TouchableOpacity>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ART WORK</Text>
                        <TouchableOpacity style={styles.artworkPicker} onPress={pickArtwork} activeOpacity={0.8}>
                            {artworkUri ? <Image source={{ uri: artworkUri }} style={styles.fullImage} /> : <View style={{ alignItems: 'center' }}><Ionicons name="image-outline" size={32} color="#444" /></View>}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>TRACK TITLE</Text>
                        <TextInput style={styles.input} placeholder="Enter song name..." placeholderTextColor="#444" value={trackTitle} onChangeText={setTrackTitle} />
                    </View>

                    {/* --- PHẦN SEARCH VỚI LỰA CHỌN ROLE --- */}
                    <View style={[styles.formGroup, { zIndex: 100 }]}>
                        <Text style={styles.label}>FEATURED & PRODUCERS</Text>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={16} color="#555" style={styles.searchIcon} />
                            <TextInput style={[styles.input, { paddingLeft: 38, flex: 1 }]} placeholder="Search artist name..." placeholderTextColor="#444" value={artistQuery} onChangeText={setArtistQuery} />
                            {isSearching && <ActivityIndicator style={styles.searchSpinner} color={Colors.teal} size="small" />}
                        </View>

                        {artistResults.length > 0 && (
                            <View style={styles.suggestionBox}>
                                {artistResults.map(item => (
                                    <View key={item.id} style={styles.suggestionItem}>
                                        <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                                        <View style={styles.roleActionRow}>
                                            <TouchableOpacity style={styles.roleBtn} onPress={() => addContributor(item, 'PRODUCER')}>
                                                <Text style={styles.roleBtnText}>+ Prod</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.roleBtn, { backgroundColor: Colors.teal }]} onPress={() => addContributor(item, 'FEATURED')}>
                                                <Text style={styles.roleBtnText}>+ Feat</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.tagContainer}>
                            {selectedContributors.map(c => (
                                <View key={c.artist.id} style={styles.tag}>
                                    <Text style={styles.tagText}>{c.artist.name} <Text style={{ fontSize: 9, opacity: 0.6 }}>({c.role === 'PRODUCER' ? 'PRD' : 'FT'})</Text></Text>
                                    <TouchableOpacity onPress={() => setSelectedContributors(selectedContributors.filter(sc => sc.artist.id !== c.artist.id))}>
                                        <Ionicons name="close-circle" size={16} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, !trackFile && styles.btnDisabled]} onPress={handleUpload} disabled={!trackFile} activeOpacity={0.85}>
                        <LinearGradient colors={['#A855F7', '#3B82F6']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.btnText}>UPLOAD TRACK</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#111', zIndex: 10 },
    backBtn: { position: 'absolute', left: 16, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    headerTitles: { alignItems: 'center' },
    headerStudio: { color: '#555', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
    headerTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    dropZone: { borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 16, borderStyle: 'dashed', padding: 30, alignItems: 'center', backgroundColor: '#080808', marginBottom: 24, gap: 6 },
    dropTitle: { color: '#FFF', fontWeight: '700', fontSize: 13, textAlign: 'center' },
    dropSubtitle: { color: '#444', fontSize: 11 },
    formGroup: { marginBottom: 24 },
    label: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 1 },
    artworkPicker: { width: 110, height: 110, backgroundColor: '#080808', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '100%', borderRadius: 14 },
    input: { backgroundColor: '#080808', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 12, height: 50, paddingHorizontal: 15, color: '#FFF', fontSize: 14 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
    searchSpinner: { position: 'absolute', right: 12 },

    // Suggestion box styles
    suggestionBox: { backgroundColor: '#111', borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: '#2A2A2A', position: 'absolute', top: 56, left: 0, right: 0, zIndex: 1000 },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    suggestionText: { color: '#FFF', flex: 1, fontSize: 13, fontWeight: '600' },
    roleActionRow: { flexDirection: 'row', gap: 8 },
    roleBtn: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    roleBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 6 },
    tagText: { color: '#FFF', fontSize: 12 },
    submitBtn: { borderRadius: 30, overflow: 'hidden', marginTop: 10 },
    btnDisabled: { opacity: 0.4 },
    gradient: { height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    loadingCircleOuter: { width: 100, height: 100, borderRadius: 50, position: 'absolute' },
    loadingGradientRing: { width: 100, height: 100, borderRadius: 50, opacity: 0.3 },
    loadingIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
    loadingTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 100 },
    loadingSubtitle: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 10 },
    reviewSectionTitle: { color: '#FFF', fontWeight: '800', fontSize: 16, marginBottom: 18 },
    audioCard: { backgroundColor: '#080808', borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#1A1A1A' },
    waveformContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 60, marginBottom: 20 },
    waveBar: { width: 3.5, borderRadius: 2 },
    sliderWrap: { flex: 1 },
    timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
    timeText: { color: '#666', fontSize: 10, fontWeight: '600' },
    playerControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    playPauseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(51, 210, 148, 0.1)', borderWidth: 1, borderColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
    progressBarWrapper: { height: 20, justifyContent: 'center' },
    progressBar: { height: 6, backgroundColor: '#1A1A1A', borderRadius: 3, position: 'relative' },
    progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 3 },
    progressKnob: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.white, top: -4, marginLeft: -7 },
    trackInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    trackThumb: { width: 56, height: 56, borderRadius: 12 },
    trackName: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 4 },
    trackSize: { color: '#777', fontSize: 12 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    reviewLabel: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    reviewLabelSub: { color: '#555', fontSize: 12 },
    artistsRow: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    artistItem: { alignItems: 'center', width: 65 },
    artistAvatar: { width: 52, height: 52, borderRadius: 26 },
    artistLabel: { color: '#CCC', fontSize: 10, textAlign: 'center', marginTop: 4 },
    roleLabelSmall: { color: Colors.teal, fontSize: 8, fontWeight: 'bold', marginTop: 2 },

    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    tagPillReview: { borderWidth: 1, borderColor: Colors.teal, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    tagPillText: { color: Colors.teal, fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#000', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60 },
    modalBackBtn: { position: 'absolute', left: 16 },
    modalHeaderTitles: { alignItems: 'center' },
    modalHeaderStudio: { color: '#555', fontSize: 10, fontWeight: 'bold' },
    modalHeaderTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    modalContent: { padding: 20 },
    modalLabel: { color: '#888', fontSize: 12, fontWeight: '700' },
    maxTagsText: { color: '#888', fontSize: 11 },
    tagSelected: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.teal, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(51, 210, 148, 0.1)' },
    tagSelectedText: { color: Colors.teal, fontSize: 13, fontWeight: '800' },
    tagUnselected: { borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    tagUnselectedText: { color: '#FFF', fontSize: 13 },
    tagDisabled: { opacity: 0.3 },
    modalOkBtn: { alignSelf: 'center', borderWidth: 1.5, borderColor: Colors.teal, borderRadius: 20, paddingHorizontal: 40, paddingVertical: 12, marginTop: 20, marginBottom: 40 },
    modalOkText: { color: Colors.teal, fontWeight: '700' },
    modalDivider: { height: 1, backgroundColor: '#222', marginVertical: 20 },
    choiceRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
});