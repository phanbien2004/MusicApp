import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { acceptFriendAPI, addFriendAPI, deleteFriendAPI } from '@/services/friendService';
import { searchAPI } from '@/services/searchService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// ─── COMPONENT ICON SÓNG NHẠC ĐỘNG ───────────────────────────────────────────
const EqualizerIcon = () => {
    const anim1 = useRef(new Animated.Value(0.5)).current;
    const anim2 = useRef(new Animated.Value(0.9)).current;
    const anim3 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const createAnim = (val: Animated.Value, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0.3, duration, useNativeDriver: true }),
                ])
            );
        };
        Animated.parallel([
            createAnim(anim1, 400),
            createAnim(anim2, 700),
            createAnim(anim3, 500),
        ]).start();
    }, []);

    return (
        <View style={styles.equalizerContainer}>
            <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim1 }] }]} />
            <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim2 }] }]} />
            <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim3 }] }]} />
        </View>
    );
};

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────
type Category = 'All' | 'Songs' | 'Albums' | 'Artists' | 'Users';
const CATEGORIES: Category[] = ['All', 'Songs', 'Albums', 'Artists', 'Users'];

interface SearchResult {
    type: 'Tracks' | 'Albums' | 'Users' | 'Artists';
    id: number;
    title?: string;
    thumbnailUrl?: string;
    duration?: number;
    contributors?: any[];
    trackUrl?: string;
    name?: string;
    avatarUrl?: string;
    friendStatus?: "ACCEPTED" | "NONE" | "PENDING_RECEIVED" | "PENDING_SENT";
}

export default function SearchScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const { currentTrack, setCurrentTrack } = useCurrentTrack()!;

    const [isFocused, setIsFocused] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState<'tracks' | 'albums' | 'members' | 'artists' | 'all'>('all');
    const [results, setResults] = useState<SearchResult[] | null>(null);
    const [loading, setLoading] = useState(false);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Friendship Logic ---
    const updateLocalFriendStatus = (id: string, status: SearchResult['friendStatus']) => {
        setResults(prev => prev?.map(item =>
            (item.type === 'Users' && item.id.toString() === id) ? { ...item, friendStatus: status } : item
        ) || null);
    };

    const handleTouchAddFriend = async (id: string) => {
        const res = await addFriendAPI(id);
        if (res.includes("successfully")) updateLocalFriendStatus(id, "PENDING_SENT");
    };

    const handleTouchAcceptFriend = async (id: string) => {
        const res = await acceptFriendAPI(id);
        if (res.includes("successfully")) updateLocalFriendStatus(id, "ACCEPTED");
    };

    const handleTouchDeleteFriend = async (id: string) => {
        const res = await deleteFriendAPI(id);
        if (res.includes("successfully")) updateLocalFriendStatus(id, "NONE");
    };

    // --- Search Logic ---
    useEffect(() => {
        if (!keyword.trim()) {
            setResults(null);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            if (accessToken) {
                setLoading(true);
                try {
                    const response = await searchAPI({ keyword, type: searchType, pageNumber: 1, pageSize: 20 });
                    const filteredResults: SearchResult[] = [];
                    response.trackPreviewDTOS?.content.forEach(t => filteredResults.push({ ...t, type: 'Tracks' }));
                    response.albumPreviewDTOS?.content.forEach(a => filteredResults.push({ ...a, type: 'Albums' }));
                    response.memberPreviewDTOS?.content.forEach(m => filteredResults.push({ ...m, type: 'Users' }));
                    response.artistPreviewDTOS?.content.forEach(ar => filteredResults.push({ ...ar, type: 'Artists' }));
                    setResults(filteredResults);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setLoading(false);
                }
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [keyword, searchType]);

    const renderItem = ({ item }: { item: SearchResult }) => {
        const isPlaying = item.type === 'Tracks' && currentTrack?.id === item.id;

        let content;
        switch (item.type) {
            case 'Tracks':
                const artistNames = item.contributors?.map(c => c.name).join(', ') || 'Unknown Artist';
                content = (
                    <TouchableOpacity
                        style={styles.itemContainer}
                        activeOpacity={0.7}
                        onPress={() => setCurrentTrack({
                            id: item.id,
                            title: item.title || '',
                            thumbnailUrl: item.thumbnailUrl || '',
                            duration: item.duration || 0,
                            contributors: item.contributors || [],
                            trackUrl: item.trackUrl || ''
                        })}
                    >
                        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
                        <View style={styles.resultInfo}>
                            <Text
                                style={[styles.resultTitle, isPlaying && { color: Colors.teal }]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            <Text style={styles.resultSubtitle} numberOfLines={1}>
                                {artistNames} • {formatDuration(item.duration || 0)}
                            </Text>
                        </View>
                        {isPlaying && <EqualizerIcon />}
                    </TouchableOpacity>
                );
                break;

            case 'Users':
                content = (
                    <View style={styles.itemContainer}>
                        <Image source={{ uri: item.avatarUrl }} style={[styles.thumbnail, styles.roundAvatar]} />
                        <View style={styles.resultInfo}>
                            <Text style={styles.resultTitle}>{item.name}</Text>
                            <Text style={styles.resultSubtitle}>User</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionBtn, item.friendStatus !== 'NONE' && styles.actionBtnActive]}
                            onPress={() => {
                                if (item.friendStatus === 'NONE') handleTouchAddFriend(item.id.toString());
                                else if (item.friendStatus === 'PENDING_RECEIVED') handleTouchAcceptFriend(item.id.toString());
                                else handleTouchDeleteFriend(item.id.toString());
                            }}
                        >
                            <Text style={[styles.actionBtnText, item.friendStatus !== 'NONE' && styles.actionBtnTextActive]}>
                                {item.friendStatus === 'ACCEPTED' ? 'Friend' :
                                    item.friendStatus === 'PENDING_SENT' ? 'Sent' :
                                        item.friendStatus === 'PENDING_RECEIVED' ? 'Accept' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
                break;

            default:
                content = (
                    <View style={styles.itemContainer}>
                        <Ionicons name="search" size={24} color={Colors.gray} style={{ marginRight: 15 }} />
                        <Text style={styles.resultTitle}>{item.title || item.name}</Text>
                    </View>
                );
        }

        return <View style={styles.resultWrapper}>{content}</View>;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>AABT</Text>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Ionicons name="notifications-outline" size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrapper}>
                <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
                    <Ionicons name="search" size={20} color={isFocused ? Colors.teal : Colors.gray} />
                    <TextInput
                        style={styles.input}
                        placeholder="Songs, artists, friends..."
                        placeholderTextColor={Colors.gray}
                        value={keyword}
                        onChangeText={setKeyword}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {loading && <ActivityIndicator size="small" color={Colors.teal} />}
                    {keyword.length > 0 && !loading && (
                        <TouchableOpacity onPress={() => setKeyword('')}>
                            <Ionicons name="close-circle" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Tabs */}
            <View style={{ height: 50 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                            onPress={() => {
                                setActiveCategory(cat);
                                const map: any = { 'All': 'all', 'Songs': 'tracks', 'Albums': 'albums', 'Artists': 'artists', 'Users': 'members' };
                                setSearchType(map[cat]);
                            }}>
                            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results List */}
            <FlatList
                data={results}
                keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && keyword ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={52} color={Colors.gray} />
                            <Text style={styles.emptyText}>No results found</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    logo: { fontSize: 26, fontWeight: '800', color: Colors.teal, letterSpacing: 2 },
    searchWrapper: { paddingHorizontal: 16, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 15, paddingHorizontal: 15, height: 50, gap: 10, borderWidth: 1, borderColor: '#2A2A2A' },
    searchBarFocused: { borderColor: Colors.teal },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    categoryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center' },
    categoryTab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
    categoryTabActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    categoryText: { fontSize: 13, fontWeight: '700', color: Colors.gray },
    categoryTextActive: { color: '#FFF' },
    listContent: { paddingHorizontal: 16, paddingBottom: 150 },
    resultWrapper: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#111' },
    itemContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    thumbnail: { width: 55, height: 55, borderRadius: 10, backgroundColor: '#1A1A1A' },
    roundAvatar: { borderRadius: 30 },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    resultSubtitle: { fontSize: 13, color: Colors.gray },

    // Equalizer Styles
    equalizerContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: 30, height: 20, gap: 3 },
    equalizerBar: { width: 3.5, height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },

    actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.teal },
    actionBtnActive: { backgroundColor: Colors.teal },
    actionBtnText: { fontSize: 12, fontWeight: '800', color: Colors.teal },
    actionBtnTextActive: { color: '#FFF' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.gray, marginTop: 10, fontSize: 16 }
});