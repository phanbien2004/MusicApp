import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function JoinJamScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── LIVE CENTER HEADER ─── */}
            <View style={styles.headerCard}>
                <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE CENTER</Text>
                </View>
                <Text style={styles.lobbyTitle}>JAM LOBBY</Text>
                <Text style={styles.lobbySubtitle}>Experience music together, in real-time.</Text>
            </View>

            {/* ─── JOIN CARD ─── */}
            <View style={styles.container}>
                <View style={styles.card}>

                    {/* Code input */}
                    <TextInput
                        style={[styles.codeInput, isFocused && styles.codeInputFocused]}
                        placeholder="Enter code ..."
                        placeholderTextColor={Colors.gray}
                        value={code}
                        onChangeText={setCode}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoCapitalize="characters"
                        textAlign="center"
                    />

                    {/* Join button */}
                    <TouchableOpacity style={styles.joinBtnWrapper} activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/jam/jamroom' as any)}>
                        <LinearGradient
                            colors={[Colors.teal, '#1AAF74']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.joinBtn}>
                            <Text style={styles.joinBtnText}>Join</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Cancel button */}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => router.push('/(tabs)/jam' as any)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
}

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
