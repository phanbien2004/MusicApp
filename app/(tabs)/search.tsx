import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

import { useAuth } from '@/context/auth-context';
import { useCurrentTrack } from '@/context/currentTrack-context';
import { searchAPI, SearchResponse } from '@/services/searchService';

type Category = 'All' | 'Songs' | 'Albums' | 'Artists' | 'Users';

const CATEGORIES: Category[] = ['All', 'Songs', 'Albums', 'Artists', 'Users'];

interface SearchResult extends SearchResponse {
    type: 'Tracks' | 'Albums' | 'Users' | 'Artists';
    id: number;
    // Thuộc tính của Tracks/Albums
    title?: string;
    thumbnailUrl?: string;
    duration?: number;
    // Thuộc tính của Members/Artists
    name?: string;
    avatarUrl?: string;
    followed?: boolean;
    friend?: boolean;
}

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const {accessToken} = useAuth();
    const { setCurrentTrack } = useCurrentTrack()!;

    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState<'tracks' | 'albums' | 'members' | 'artists' | 'all'>('all');
    const [results, setResults] = useState<SearchResult[] | null>(null);


    const handleTouchAddFriend = (id: string) => {
        console.log("Add friend with id:", id);
        const newResults   = results?.map(item => {
            if(item.type === 'Users' && item.id.toString() === id) {
                const tmp = item.friend;
                return {...item, friend: !tmp};
            }
            return item;
        })
        if(newResults) {
            setResults(newResults);
        }
    };

    const filterData = (searchResponse: SearchResponse) => {
        const filteredResults: SearchResult[] = [];
        searchResponse.trackPreviewDTOS?.content.forEach(track => {
            filteredResults.push({ ...track, type: 'Tracks'});
        });
        searchResponse.albumPreviewDTOS?.content.forEach(album => {
            filteredResults.push({ ...album, type: 'Albums' });
        });
        searchResponse.memberPreviewDTOS?.content.forEach(member => {
            filteredResults.push({ ...member, type: 'Users' });
        });
        searchResponse.artistPreviewDTOS?.content.forEach(artist => {
            filteredResults.push({ ...artist, type: 'Artists' });
        });
        setResults(filteredResults);
        console.log("Filtered results:", filteredResults);
    }

    useEffect(() => {
        if (!keyword.trim()) {
            setResults(null);
            return;
        }

        let isMounted = true;

        if(accessToken) {
            const delayDebounce = setTimeout(async () => {
            try {
                const response = await searchAPI(
                    { 
                        keyword, 
                        type, 
                        pageNumber: 1, 
                        pageSize: 10 
                    },
                    accessToken
                );
                console.log("Search response:", response);
                console.log("Member response:", response.memberPreviewDTOS?.content);
                filterData(response);
            } catch (error) {
                if (isMounted) {
                    console.error("Error searching:", error);
                }
            }}, 500);
        }else{
            console.log("Error Search: Not AccessToken");
        }
    }, [keyword, type]);
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
                    value={keyword}
                    onChangeText={(text) => setKeyword(text)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    returnKeyType="search"
                    />
                    {keyword.length > 0 && (
                        <TouchableOpacity onPress={() => setKeyword('')}>
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
                    onPress={() => {
                        setActiveCategory(cat);
                        if(cat == 'All') {
                            setType('all');
                        }else if (cat == 'Albums') {
                            setType('albums');
                        }else if (cat == 'Artists') {
                            setType('artists');
                        }else if(cat == 'Songs') {
                            setType('tracks')
                        }else{
                            setType('members')
                        }
                    }}>
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
                data={results}
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
                renderItem={({ item }) => {
                    let content;
                    switch (item.type) {
                        case 'Tracks':
                            content = <Text>[SONG]</Text>;
                            break;
                        case 'Albums':
                            content = <Text>[ALBUM]</Text>;
                            break;
                        case 'Artists':
                            content = <Text>[ARTIST]</Text>;
                            break;
                        case 'Users':
                            content = 
                            <View style={styles.resultItem}>
                                <Image 
                                    source={{ uri: item.avatarUrl }} 
                                    style={styles.thumbnail} 
                                />
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultTitle}>{item.name}</Text>
                                </View>
                                {item.friend ?  (
                                    <TouchableOpacity 
                                        style={styles.actionBtn}
                                        onPress={() => handleTouchAddFriend(item.id.toString())}
                                    > 
                                        <Text style={styles.actionBtnText}>Added</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.actionBtnActive]}
                                        onPress={() => handleTouchAddFriend(item.id.toString())}
                                    > 
                                        <Text>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            break;
                        default:
                            content = <Text style={{color: 'red'}}>Unknown: {item.type}</Text>;
                    }
                    return (
                        <TouchableOpacity 
                            style={styles.resultItem} 
                        >
                            {content}
                        </TouchableOpacity>
                    )}}
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
