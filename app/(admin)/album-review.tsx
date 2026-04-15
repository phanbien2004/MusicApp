import { Colors } from '@/constants/theme';
import { getAllPendingAlbumsAPI, PendingAlbumDTO } from '@/services/admin/adminService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-root-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 8;

export default function AlbumReview() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [albums, setAlbums] = useState<PendingAlbumDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchAlbums = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const res = await getAllPendingAlbumsAPI(currentPage, PAGE_SIZE);
            setAlbums(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalItems(res.totalElements || 0);
        } catch (error) {
            console.error('Fetch pending albums failed:', error);
            Toast.show('Failed to load pending albums.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAlbums(page);
        }, [fetchAlbums, page]),
    );

    const renderAlbum = ({ item }: { item: PendingAlbumDTO }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({
                pathname: '/(admin)/album-detail',
                params: {
                    id: String(item.id),
                    title: item.title || '',
                    thumbnailUrl: item.thumbnailUrl || '',
                    releaseYear: String(item.releaseYear || ''),
                },
            } as any)}
        >
            <LinearGradient
                colors={['#121212', '#0E1D1A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <Image
                    source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/160x160/111111/666666' }}
                    style={styles.cover}
                />
                <View style={styles.cardBody}>
                    <Text style={styles.albumTitle} numberOfLines={2}>{item.title || 'Untitled Album'}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                            <Ionicons name="albums-outline" size={14} color={Colors.teal} />
                            <Text style={styles.metaText}>Pending</Text>
                        </View>
                        <Text style={styles.yearText}>{item.releaseYear || 'N/A'}</Text>
                    </View>
                    <Text style={styles.helperText}>Album ID #{item.id}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Album Review</Text>
                    <Text style={styles.headerSubtitle}>{totalItems} pending albums</Text>
                </View>
                <TouchableOpacity onPress={() => fetchAlbums(page)} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color={Colors.teal} />
                </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator color={Colors.teal} size="large" />
                </View>
            ) : (
                <FlatList
                    data={albums}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderAlbum}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="disc-outline" size={42} color="#2D2D2D" />
                            <Text style={styles.emptyTitle}>No pending albums</Text>
                            <Text style={styles.emptySubtitle}>There is nothing waiting for review right now.</Text>
                        </View>
                    }
                />
            )}

            <View style={[styles.paginationDock, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[styles.dockBtn, page <= 1 && styles.dockBtnDisabled]}
                    onPress={() => setPage((prev) => prev - 1)}
                    disabled={page <= 1}
                >
                    <Ionicons name="chevron-back" size={22} color={page <= 1 ? '#444' : '#FFF'} />
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                    <Text style={styles.pageCurrent}>{page}</Text>
                    <Text style={styles.pageDivider}>/</Text>
                    <Text style={styles.pageTotal}>{totalPages}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.dockBtn, page >= totalPages && styles.dockBtnDisabled]}
                    onPress={() => setPage((prev) => prev + 1)}
                    disabled={page >= totalPages}
                >
                    <Ionicons name="chevron-forward" size={22} color={page >= totalPages ? '#444' : '#FFF'} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: Colors.teal,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#111',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#222',
    },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 28,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    cover: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#191919',
    },
    cardBody: {
        flex: 1,
        marginLeft: 16,
        gap: 10,
    },
    albumTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#10221D',
        borderWidth: 1,
        borderColor: '#1F4F42',
    },
    metaText: {
        color: Colors.teal,
        fontSize: 12,
        fontWeight: '700',
    },
    yearText: {
        color: '#8E8E8E',
        fontSize: 13,
        fontWeight: '700',
    },
    helperText: {
        color: '#5F5F5F',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 120,
        gap: 10,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: '#D5D5D5',
        fontSize: 16,
        fontWeight: '800',
    },
    emptySubtitle: {
        color: '#636363',
        textAlign: 'center',
    },
    paginationDock: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: '#161616',
        borderRadius: 35,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    dockBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dockBtnDisabled: {
        opacity: 0.2,
    },
    pageIndicator: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 5,
    },
    pageCurrent: {
        color: Colors.teal,
        fontSize: 18,
        fontWeight: '900',
    },
    pageDivider: {
        color: '#333',
        fontSize: 16,
    },
    pageTotal: {
        color: '#666',
        fontSize: 14,
        fontWeight: '700',
    },
});
