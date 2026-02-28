import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const notifications = [
    {
        id: '1',
        user: 'Iam HDA',
        action: "jumped to 1:12 of the track",
        target: '"Em của ngày hôm qua"',
        hasCheck: true,
        time: '2m ago',
    },
    {
        id: '2',
        user: 'Iam HDA',
        action: 'joined the Jam with an invite code',
        target: '',
        hasCheck: false,
        time: '5m ago',
    },
    {
        id: '3',
        user: 'One Kill',
        action: 'was invited to the Jam by',
        target: 'Iam HDA',
        hasCheck: false,
        time: '8m ago',
    },
    {
        id: '4',
        user: 'Bien',
        action: 'add',
        target: '"Con mưa ngang" qua to playlist',
        hasCheck: false,
        time: '12m ago',
    },
];

export default function JamNotificationScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.push('/(tabs)/jamroom' as any)}>
                    <Ionicons name="chevron-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="people" size={18} color={Colors.teal} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Live Jam Session</Text>
                        <Text style={styles.headerSub}>Synchronized with 4 others</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* ─── NOTIFICATION LIST ─── */}
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                    <View style={styles.notifItem}>
                        {/* Avatar */}
                        <View style={styles.notifAvatar} />

                        {/* Text */}
                        <View style={styles.notifText}>
                            <Text style={styles.notifBody}>
                                <Text style={styles.notifUser}>{item.user} </Text>
                                <Text style={styles.notifAction}>{item.action} </Text>
                                {item.target ? (
                                    <Text style={styles.notifTarget}>{item.target}</Text>
                                ) : null}
                            </Text>
                            <Text style={styles.notifTime}>{item.time}</Text>
                        </View>

                        {/* Check icon */}
                        {item.hasCheck && (
                            <Ionicons name="checkmark-circle" size={22} color={Colors.teal} />
                        )}
                    </View>
                )}
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
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#0F2D24',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.teal,
    },
    headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
    headerSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },

    divider: { height: 1, backgroundColor: '#1A1A1A', marginHorizontal: 16 },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    separator: { height: 1, backgroundColor: '#111', marginLeft: 60 },

    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
    },
    notifAvatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#2A2A2A',
        borderWidth: 1, borderColor: '#333',
        flexShrink: 0,
    },
    notifText: { flex: 1 },
    notifBody: { lineHeight: 20 },
    notifUser: { fontSize: 14, fontWeight: '700', color: Colors.white },
    notifAction: { fontSize: 14, color: Colors.gray },
    notifTarget: { fontSize: 14, color: Colors.teal, fontWeight: '600' },
    notifTime: { fontSize: 12, color: Colors.gray, marginTop: 4 },
});
