import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const PLAYLIST_CARD = (width - 48 - 12) / 2;

const playlists = [
    { id: '1', name: 'List 1', color: '#1DB954' },
    { id: '2', name: 'List 2', color: '#1A1A1A' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ─── HEADER ICONS ─── */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => {
                                logout();
                                router.replace('/login');
                            }}>
                            <Ionicons name="settings-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── PROFILE CARD ─── */}
                <View style={styles.profileCard}>
                    {/* Avatar + Name */}
                    <View style={styles.profileTop}>
                        <View style={styles.avatar} />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Biên</Text>
                            <Text style={styles.profileHandle}>@bienne</Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>500</Text>
                            <Text style={styles.statLabel}>FOLLOWING</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>20</Text>
                            <Text style={styles.statLabel}>FRIENDS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>20</Text>
                            <Text style={styles.statLabel}>PLAYLIST</Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.editBtn}>
                            <Ionicons name="pencil-outline" size={16} color={Colors.white} />
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.artistBtn}
                            onPress={() => router.push('/(tabs)/registerartist' as any)}>
                            <Ionicons name="musical-notes-outline" size={16} color={Colors.white} />
                            <Text style={styles.artistBtnText}>Register Artist</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── MY PLAYLISTS ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Playlists</Text>
                    <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add" size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.playlistsGrid}>
                    {playlists.map(item => (
                        <TouchableOpacity key={item.id} style={styles.playlistCard}>
                            <View style={[styles.playlistThumb, { backgroundColor: item.color }]} />
                            <Text style={styles.playlistName}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: 120,
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
    },

    // Profile card
    profileCard: {
        marginHorizontal: 16,
        backgroundColor: '#0D0D0D',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        padding: 20,
        gap: 18,
        marginBottom: 20,
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 72, height: 72,
        borderRadius: 14,
        backgroundColor: '#2A2A2A',
        borderWidth: 1, borderColor: '#333',
    },
    profileInfo: { gap: 4 },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
    },
    profileHandle: {
        fontSize: 14,
        color: Colors.gray,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        overflow: 'hidden',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        gap: 4,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.teal,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 10,
    },

    // Action buttons
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.white,
    },
    artistBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.teal,
    },
    artistBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.white,
    },

    // Playlists
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.white,
    },
    addBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
    },
    playlistsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    playlistCard: {
        width: PLAYLIST_CARD,
        gap: 10,
    },
    playlistThumb: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    playlistName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.white,
    },
});
