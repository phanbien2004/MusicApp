import { Colors } from '@/constants/theme';
import { useJam } from '@/context/jam-context';
import { createJamSessionAPI, resolveJamSession } from '@/services/jamService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const ROOM_SIZES = [2, 4, 6, 8, 10];

export default function SetupJamScreen() {
    const router = useRouter();
    const { setActiveSession } = useJam();
    const [privacyMode, setPrivacyMode] = useState(false);
    const [roomSize, setRoomSize] = useState(4);
    const [loading, setLoading] = useState(false);

    const handleStartJam = async () => {
        try {
            setLoading(true);
            const res = await createJamSessionAPI(roomSize, privacyMode);
            // Backend trả về message thành công, sau đó bạn có thể lấy ID từ profile hoặc API list jam
            const session = resolveJamSession(res);

            if (!session?.sessionId) {
                throw new Error('Missing jam session id in create response');
            }

            await setActiveSession({
                ...session,
                size: session.size ?? roomSize,
                isPrivate: session.isPrivate ?? privacyMode,
                isHost: true,
            });

            router.navigate(`/jam/jamroom?jamId=${session.sessionId}` as any);
        } catch {
            Alert.alert("Error", "Could not create Jam session.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.iconWrapper}><Ionicons name="shield-checkmark" size={40} color={Colors.teal} /></View>
                    <Text style={styles.title}>Jam Room Setup</Text>
                    <View style={styles.divider} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIconWrapper}><Ionicons name="lock-closed" size={18} color={Colors.gray} /></View>
                            <View><Text style={styles.settingLabel}>Privacy Mode</Text><Text style={styles.settingDesc}>Friends Only</Text></View>
                        </View>
                        <Switch value={privacyMode} onValueChange={setPrivacyMode} trackColor={{ false: '#333', true: Colors.teal }} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.sizeSection}>
                        <Text style={styles.settingLabel}>Maximum number of people</Text>
                        <View style={styles.sizeRow}>
                            {ROOM_SIZES.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[styles.sizeChip, roomSize === size && styles.sizeChipActive]}
                                    onPress={() => setRoomSize(size)}
                                >
                                    <Text style={[styles.sizeChipText, roomSize === size && styles.sizeChipTextActive]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.startBtnWrapper} onPress={handleStartJam} disabled={loading}>
                        <LinearGradient colors={[Colors.teal, '#1AAF74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="play-circle" size={22} color={Colors.white} /><Text style={styles.startBtnText}>Start Jam Session</Text></>}
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace('/(tabs)/jam' as any)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
// ... Giữ styles cũ của bạn ...
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },

    // Card
    card: {
        backgroundColor: '#0D0D0D',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: Colors.teal,
        borderStyle: 'dashed',
        padding: 28,
        alignItems: 'center',
        gap: 16,
    },

    // Icon
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#0F2D24',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },

    // Text
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.gray,
        textAlign: 'center',
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#1E1E1E',
    },

    // Setting row
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 4,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    settingIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.white,
    },
    settingDesc: {
        fontSize: 12,
        color: Colors.gray,
        marginTop: 2,
    },
    sizeSection: {
        width: '100%',
        gap: 12,
    },
    sizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sizeChip: {
        minWidth: 48,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    sizeChipActive: {
        borderColor: Colors.teal,
        backgroundColor: '#0F2D24',
    },
    sizeChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.gray,
    },
    sizeChipTextActive: {
        color: Colors.white,
    },

    // Buttons
    startBtnWrapper: { width: '100%' },
    startBtn: {
        width: '100%',
        height: 54,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    startBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    cancelBtn: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.gray,
    },
});
