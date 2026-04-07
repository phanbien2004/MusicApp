import { Colors } from '@/constants/theme';
import { useJam } from '@/context/jam-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function JamScreen() {
    const router = useRouter();
    const { activeSession, isHydrated } = useJam();
    const activeJamId = activeSession?.sessionId;

    useEffect(() => {
        if (isHydrated && activeJamId) {
            router.replace({
                pathname: '/(tabs)/jam/jamroom',
                params: { jamId: String(activeJamId) },
            } as any);
        }
    }, [activeJamId, isHydrated, router]);

    if (!isHydrated || activeJamId) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.teal} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* ─── LIVE CENTER HEADER ─── */}
            <View style={styles.headerCard}>
                <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE CENTER</Text>
                </View>
                <Text style={styles.lobbyTitle}>JAM LOBBY</Text>
                <Text style={styles.lobbySubtitle}>Experience music together, in real-time.</Text>
            </View>

            {/* ─── CARDS ─── */}
            <View style={styles.cardsContainer}>

                {/* Host a Jam */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(tabs)/jam/setupjam' as any)}>
                    <View style={[styles.iconWrapper, { backgroundColor: '#3D2B6B' }]}>
                        <Ionicons name="shield-checkmark" size={32} color="#A78BFA" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Host a Jam</Text>
                        <Text style={styles.cardDesc}>
                            Start a synchronized session and control the master vibe
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Join Jam */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(tabs)/jam/joinjam' as any)}>
                    <View style={[styles.iconWrapper, { backgroundColor: '#0F2D24' }]}>
                        <Ionicons name="git-merge" size={32} color={Colors.teal} />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Join Jam</Text>
                        <Text style={styles.cardDesc}>
                            Jump into an active stream and see what is trending
                        </Text>
                    </View>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    // Header card
    headerCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.teal,
        borderStyle: 'dashed',
    },
    liveBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.teal,
        marginBottom: 10,
    },
    liveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.teal,
        letterSpacing: 2,
    },
    lobbyTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: 1,
        marginBottom: 6,
    },
    lobbySubtitle: {
        fontSize: 13,
        color: Colors.gray,
    },

    // Cards
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 14,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 18,
        padding: 20,
        gap: 18,
        borderWidth: 1,
        borderColor: '#1E1E1E',
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: { flex: 1 },
    cardTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 19,
    },
});
