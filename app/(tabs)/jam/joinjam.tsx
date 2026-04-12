import { Colors } from '@/constants/theme';
import { useJam } from '@/context/jam-context';
// import { joinJamSessionByCodeAPI, resolveJamSession } from '@/services/jamService';
import { joinJamSessionByCodeAPI } from '@/services/jamService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function JoinJamScreen() {
    const router = useRouter();
    const { setActiveSession } = useJam();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!code.trim()) return;
        try {
            setLoading(true);
            const inputValue = code.trim();
            const res = await joinJamSessionByCodeAPI(inputValue);
            if(res) {
                setActiveSession({
                    sessionId: res,
                    isHost: false
                })
                router.replace(`/(tabs)/jam/jamroom?jamId=${res}` as any);
            }
            return;
        } catch {
            Alert.alert("Oops!", "Could not join this Jam room.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <TextInput
                        style={styles.codeInput}
                        placeholder="Enter invite code..."
                        placeholderTextColor={Colors.gray}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="default"
                        autoCapitalize="characters"
                        textAlign="center"
                    />
                    <TouchableOpacity style={styles.joinBtnWrapper} onPress={handleJoin} disabled={loading}>
                        <LinearGradient colors={[Colors.teal, '#1AAF74']} style={styles.joinBtn}>
                            <Text style={styles.joinBtnText}>{loading ? 'Joining...' : 'Join'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
// ... Giữ styles cũ ...
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    // Header (same as jam.tsx)
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

    // Join card
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#0D0D0D',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        padding: 24,
        gap: 14,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modeChip: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeChipActive: {
        borderColor: Colors.teal,
        backgroundColor: '#0F2D24',
    },
    modeChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.gray,
    },
    modeChipTextActive: {
        color: Colors.white,
    },

    // Code input
    codeInput: {
        width: '100%',
        height: 58,
        borderRadius: 14,
        backgroundColor: '#111',
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
        color: Colors.white,
        fontWeight: '700',
        paddingHorizontal: 16,
        fontSize: 18,
        letterSpacing: 4,
    },
    codeInputFocused: {
        borderColor: Colors.teal,
    },

    // Join button
    joinBtnWrapper: { width: '100%' },
    joinBtn: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 1,
    },

    // Cancel
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
