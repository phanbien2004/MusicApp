import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    FlatList,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

type Category = 'All' | 'Songs' | 'Albums' | 'Artists' | 'Users';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    duration?: string;
    type: Category;
}

const allResults: SearchResult[] = [
    { id: '1', title: 'Em Của Ngày Hôm Qua', subtitle: 'Sơn Tùng MTP', duration: '3:36', type: 'Songs' },
    { id: '2', title: 'Nơi Này Có Anh', subtitle: 'Sơn Tùng MTP', duration: '4:12', type: 'Songs' },
    { id: '3', title: 'Chạy Ngay Đi', subtitle: 'Sơn Tùng MTP', duration: '3:55', type: 'Songs' },
    { id: '4', title: 'Lạc Trôi', subtitle: 'Sơn Tùng MTP', duration: '4:05', type: 'Songs' },
    { id: '5', title: 'Muộn Rồi Mà Sao Còn', subtitle: 'Sơn Tùng MTP', duration: '5:20', type: 'Songs' },
    { id: '6', title: 'Sky Tour', subtitle: 'Sơn Tùng MTP • 2019', duration: '', type: 'Albums' },
    { id: '7', title: 'm-tp M-TP', subtitle: 'Sơn Tùng MTP • 2017', duration: '', type: 'Albums' },
    { id: '8', title: 'Sơn Tùng MTP', subtitle: '5.2M followers', duration: '', type: 'Artists' },
    { id: '9', title: 'Đen Vâu', subtitle: '3.1M followers', duration: '', type: 'Artists' },
    { id: '10', title: 'Mãi Như Ngày Hôm Qua', subtitle: 'Iam HDA', duration: '4:30', type: 'Songs' },
    { id: '11', title: 'Iam HDA', subtitle: 'Online • Listening to Sơn Tùng', duration: '', type: 'Users' },
    { id: '12', title: 'OneKill', subtitle: 'Offline • Last seen 2h ago', duration: '', type: 'Users' },
    { id: '13', title: 'MinhThu', subtitle: 'Online • Listening to Đen Vâu', duration: '', type: 'Users' },
    { id: '14', title: 'Alex99', subtitle: 'Offline • Last seen yesterday', duration: '', type: 'Users' },
];

const CATEGORIES: Category[] = ['All', 'Songs', 'Albums', 'Artists', 'Users'];

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>('Songs');
    const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const toggleFollow = (id: string) => {
        setFollowedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAdd = (id: string) => {
        setAddedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filtered = allResults.filter((item) => {
        const matchCategory = activeCategory === 'All' || item.type === activeCategory;
        const matchQuery = query.trim() === '' ||
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase());
        return matchCategory && matchQuery;
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.logo}>AABT</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push('/(tabs)/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── SEARCH BAR ─── */}
            <View style={styles.searchWrapper}>
                <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={isFocused ? Colors.teal : Colors.gray}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Search songs, artists, friends..."
                        placeholderTextColor={Colors.gray}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ─── CATEGORY TABS ─── */}
            <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                        onPress={() => setActiveCategory(cat)}>
                        <Text style={[
                            styles.categoryText,
                            activeCategory === cat && styles.categoryTextActive,
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ─── RESULTS ─── */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={52} color={Colors.gray} />
                        <Text style={styles.emptyText}>No results found</Text>
                        <Text style={styles.emptySubText}>Try a different keyword</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem}>
                        {/* Thumbnail */}
                        <View style={[
                            styles.thumbnail,
                            (item.type === 'Artists' || item.type === 'Users') && styles.thumbnailRound,
                        ]}>
                            <Ionicons
                                name={
                                    item.type === 'Artists' ? 'person' :
                                        item.type === 'Users' ? 'person' :
                                            item.type === 'Albums' ? 'disc' : 'musical-notes'
                                }
                                size={20}
                                color="#555"
                            />
                        </View>

                        {/* Info */}
                        <View style={styles.resultInfo}>
                            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                        </View>

                        {/* Right action: Follow / Add / Duration / Menu */}
                        {item.type === 'Artists' ? (
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    followedIds.has(item.id) && styles.actionBtnActive,
                                ]}
                                onPress={() => toggleFollow(item.id)}>
                                <Text style={[
                                    styles.actionBtnText,
                                    followedIds.has(item.id) && styles.actionBtnTextActive,
                                ]}>
                                    {followedIds.has(item.id) ? 'Following' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        ) : item.type === 'Users' ? (
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    addedIds.has(item.id) && styles.actionBtnActive,
                                ]}
                                onPress={() => toggleAdd(item.id)}>
                                <Text style={[
                                    styles.actionBtnText,
                                    addedIds.has(item.id) && styles.actionBtnTextActive,
                                ]}>
                                    {addedIds.has(item.id) ? 'Added' : 'Add'}
                                </Text>
                            </TouchableOpacity>
                        ) : item.duration ? (
                            <Text style={styles.duration}>{item.duration}</Text>
                        ) : (
                            <TouchableOpacity>
                                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    logo: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 2,
    },
    headerIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },

    // Search bar
    searchWrapper: { paddingHorizontal: 16, marginBottom: 14 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 10,
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
    },
    searchBarFocused: {
        borderColor: Colors.teal,
        backgroundColor: '#111',
    },
    input: {
        flex: 1,
        color: Colors.white,
        fontSize: 15,
        padding: 0,
    },

    // Category tabs
    categoryRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 8,
    },
    categoryTab: {
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    categoryTabActive: {
        backgroundColor: Colors.teal,
        borderColor: Colors.teal,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.gray,
    },
    categoryTextActive: {
        color: Colors.white,
    },

    // Results
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 120,
    },
    separator: {
        height: 1,
        backgroundColor: '#111',
        marginLeft: 72,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 14,
    },
    thumbnail: {
        width: 52, height: 52,
        borderRadius: 8,
        backgroundColor: '#1E1E1E',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
    },
    thumbnailRound: { borderRadius: 26 },
    resultInfo: { flex: 1 },
    resultTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 3,
    },
    resultSubtitle: {
        fontSize: 13,
        color: Colors.gray,
    },
    duration: {
        fontSize: 13,
        color: Colors.gray,
    },

    // Follow / Add action buttons
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.teal,
    },
    actionBtnActive: {
        backgroundColor: Colors.teal,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.teal,
    },
    actionBtnTextActive: {
        color: Colors.white,
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        gap: 10,
    },
    emptyText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.white,
    },
    emptySubText: {
        fontSize: 14,
        color: Colors.gray,
    },
});
