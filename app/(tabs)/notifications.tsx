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

interface Notification {
    id: string;
    name: string;
    content: string;
    time: string;
    type: 'jam' | 'friend' | 'like' | 'follow';
}

const notificationsData: Notification[] = [
    {
        id: '1',
        name: 'Iam HDA',
        content: 'invited you to a Jam',
        time: 'Just now',
        type: 'jam',
    },
    {
        id: '2',
        name: 'OneKill',
        content: 'Sent you a friend request',
        time: '16 minutes ago',
        type: 'friend',
    },
    {
        id: '3',
        name: 'Sơn Tùng MTP',
        content: 'liked your playlist',
        time: '1 hour ago',
        type: 'like',
    },
    {
        id: '4',
        name: 'Alex99',
        content: 'started following you',
        time: '3 hours ago',
        type: 'follow',
    },
    {
        id: '5',
        name: 'MinhThu',
        content: 'invited you to a Jam',
        time: 'Yesterday',
        type: 'jam',
    },
    {
        id: '6',
        name: 'Đen Vâu',
        content: 'Sent you a friend request',
        time: '2 days ago',
        type: 'friend',
    },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const [dismissed, setDismissed] = useState<string[]>([]);

    const handleDismiss = (id: string) => {
        setDismissed((prev) => [...prev, id]);
    };

    const activeNotifications = notificationsData.filter(
        (n) => !dismissed.includes(n.id)
    );

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'jam': return 'people';
            case 'friend': return 'person-add';
            case 'like': return 'heart';
            case 'follow': return 'person';
        }
    };

    useFocusEffect(
        useCallback(() => {
            console.log('Active notifications');
        }, [])
    );

    // Chỉ jam và friend request mới cần nút Accept/Reject
    const hasActions = (type: Notification['type']) =>
        type === 'jam' || type === 'friend';

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={styles.notifItem}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={22} color="#555" />
                </View>
                <View style={[
                    styles.typeIconBadge,
                    item.type === 'like' && { backgroundColor: '#E11D48' },
                    item.type === 'follow' && { backgroundColor: '#7C3AED' },
                ]}>
                    <Ionicons name={getTypeIcon(item.type)} size={10} color={Colors.white} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.contentText}>{item.content}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
            </View>

            {/* Action buttons — chỉ dành cho jam & friend request */}
            {hasActions(item.type) ? (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtnReject}
                        onPress={() => handleDismiss(item.id)}>
                        <Ionicons name="close" size={18} color="#FF5555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnAccept}>
                        <Ionicons name="checkmark" size={18} color={Colors.teal} />
                    </TouchableOpacity>
                </View>
            ) : (
                // like / follow: chỉ hiện icon nhỏ thông tin, không có hành động
                <View style={styles.infoIconWrapper}>
                    <Ionicons
                        name={item.type === 'like' ? 'heart' : 'person-add-outline'}
                        size={20}
                        color={item.type === 'like' ? '#E11D48' : '#7C3AED'}
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
                data={activeNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={56} color={Colors.gray} />
                        <Text style={styles.emptyText}>Không có thông báo mới</Text>
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
});
