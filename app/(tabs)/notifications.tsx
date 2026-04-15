import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useCurrentTrack } from '@/context/currentTrack-context';
import { useJam } from '@/context/jam-context';
import { NotificationDTO, useNotifications } from '@/context/notification-context';
import { usePlayer } from '@/context/player-context';
import { acceptFriendAPI } from '@/services/friendService';
import { getJam, joinJamSessionByIdAPI } from '@/services/jamService';

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, markAllAsRead, dismissNotification } = useNotifications();
    const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
    const { setActiveSession } = useJam();
    const { setCurrentTrack } = useCurrentTrack()!;
    const { setLastActiveTab } = usePlayer();

    // Mark as read when focusing the screen
    useFocusEffect(
        useCallback(() => {
            markAllAsRead();
        }, [markAllAsRead])
    );

    const handleDismiss = (id: string | number) => {
        dismissNotification(id);
    };

    const handleAcceptAction = async (item: NotificationDTO) => {
        try {
            if (item.type === 'FRIEND_REQUEST' && item.friendRequestSenderId) {
                await acceptFriendAPI(item.friendRequestSenderId.toString());
                setAcceptedIds((prev) => [...prev, String(item.notificationId)]);
            }
            else if (item.type === 'JAM_INVITE' && item.jamSessionId) {
                const res = await joinJamSessionByIdAPI(item.jamSessionId);
                if(res) {
                    setActiveSession({
                        sessionId: res,
                        isHost: false
                    });
                    const dataJam = await getJam(res);
                    if(dataJam && dataJam.jamTrack) {
                        const seekPosition = dataJam.jamTrack.currentSeekPosition ?? 0;
                        const isPlaying   = dataJam.jamTrack.playing  ?? false;
                        console.log("[JamSync] seekPosition:", seekPosition, "| isPlaying:", isPlaying);
                        setCurrentTrack(dataJam.jamTrack, true);
                        // Đặt tab đang sáng thành JAM trước khi navigate
                        setLastActiveTab('jam');
                        router.push({
                            pathname: '/jam/jamroom',
                            params: {
                                jamId: String(res),
                                seekPosition: String(seekPosition),
                                isPlaying: String(isPlaying),
                                t: Date.now(),
                            },
                        } as any);
                    }
                }
                setAcceptedIds((prev) => [...prev, String(item.notificationId)]);
            }
        } catch (error) {
            console.error("Lỗi chấp nhận lời mời:", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'JAM_JOIN':
            case 'JAM_INVITE':
            case 'JAM_INTERACTION': return 'people';
            case 'FRIEND_REQUEST': return 'person-add';
            case 'SONG_RELEASING': return 'musical-notes';
            case 'PLAYLIST_COLLABORATION': return 'albums';
            default: return 'notifications';
        }
    };

    useFocusEffect(
        useCallback(() => {
            console.log('Active notifications opened');
        }, [])
    );

    const hasActions = (type: string) =>
        type === 'JAM_INVITE' || type === 'FRIEND_REQUEST';

    const renderItem = ({ item }: { item: NotificationDTO }) => (
        <View style={styles.notifItem}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={22} color="#555" />
                </View>
                <View style={[
                    styles.typeIconBadge,
                    item.type === 'SONG_RELEASING' && { backgroundColor: '#E11D48' },
                    item.type === 'FRIEND_REQUEST' && { backgroundColor: '#7C3AED' },
                ]}>
                    <Ionicons name={getTypeIcon(item.type) as any} size={10} color={Colors.white} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.nameText}>
                    {item.type.replace('_', ' ')}
                </Text>
                <Text style={styles.contentText}>{item.message}</Text>
                <Text style={styles.timeText}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                </Text>
            </View>

            {/* Action buttons */}
            {hasActions(item.type) ? (
                acceptedIds.includes(String(item.notificationId)) ? (
                    <View style={styles.acceptedBadge}>
                        <Ionicons name="checkmark-done" size={16} color={Colors.teal} />
                        <Text style={styles.acceptedText}>Accepted</Text>
                    </View>
                ) : 
                (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionBtnReject}
                            onPress={() => handleDismiss(item.notificationId || Date.now())}>
                            <Ionicons name="close" size={18} color="#FF5555" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.actionBtnAccept}
                            onPress={() => handleAcceptAction(item)}
                        >
                            <Ionicons name="checkmark" size={18} color={Colors.teal} />
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                <View style={styles.infoIconWrapper}>
                    <Ionicons
                        name={item.type === 'SONG_RELEASING' ? 'heart' : 'notifications-outline'}
                        size={20}
                        color={item.type === 'SONG_RELEASING' ? '#E11D48' : '#7C3AED'}
                    />
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.logo}>AABT</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push('/(tabs)/search')}>
                        <Ionicons name="search-outline" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/home')}>
                        <Ionicons name="notifications" size={24} color={Colors.teal} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* ─── LIST ─── */}
            <FlatList
                data={notifications}
                keyExtractor={(item, index) => item.notificationId ? String(item.notificationId) : `temp-${index}`}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={56} color={Colors.gray} />
                        <Text style={styles.emptyText}>No new notifications</Text>
                    </View>
                }
            />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    logo: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 2,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        position: 'relative',
    },
    notifBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.teal,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    notifBadgeText: {
        color: '#000',
        fontSize: 9,
        fontWeight: '900',
    },
    separator: {
        height: 1,
        backgroundColor: '#222',
        marginHorizontal: 0,
    },

    // Title
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.white,
    },
    countBadge: {
        backgroundColor: Colors.teal,
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },

    // List
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },

    // Notification item
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1E1E1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#333',
    },
    typeIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.teal,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    content: {
        flex: 1,
        gap: 2,
    },
    nameText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
    },
    contentText: {
        fontSize: 13,
        color: '#C0C0C0',
        lineHeight: 18,
    },
    timeText: {
        fontSize: 12,
        color: Colors.gray,
        marginTop: 2,
    },

    // Action buttons
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionBtnReject: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,85,85,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,85,85,0.3)',
    },
    actionBtnAccept: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `rgba(51,210,148,0.12)`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: `rgba(51,210,148,0.3)`,
    },
    itemSeparator: {
        height: 1,
        backgroundColor: '#111',
        marginLeft: 68,
    },

    infoIconWrapper: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.gray,
    },
    acceptedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(51,210,148,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(51,210,148,0.3)',
    },
    acceptedText: {
        color: Colors.teal,
        fontSize: 12,
        fontWeight: '700',
    }
});


