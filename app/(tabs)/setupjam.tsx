import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SetupJamScreen() {
    const router = useRouter();
    const [privacyMode, setPrivacyMode] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.container}>
                {/* ─── SETUP CARD ─── */}
                <View style={styles.card}>

                    {/* Shield icon */}
                    <View style={styles.iconWrapper}>
                        <Ionicons name="shield-checkmark" size={40} color={Colors.teal} />
                    </View>

                    <Text style={styles.title}>Jam Room Setup</Text>
                    <Text style={styles.subtitle}>Configure your session before inviting</Text>

                    <View style={styles.divider} />

                    {/* Privacy Mode row */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIconWrapper}>
                                <Ionicons name="lock-closed" size={18} color={Colors.gray} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Privacy Mode</Text>
                                <Text style={styles.settingDesc}>Friend Only</Text>
                            </View>
                        </View>
                        <Switch
                            value={privacyMode}
                            onValueChange={setPrivacyMode}
                            trackColor={{ false: '#333', true: Colors.teal }}
                            thumbColor={Colors.white}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Start button */}
                    <TouchableOpacity
                        style={styles.startBtnWrapper}
                        activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/jamroom' as any)}>
                        <LinearGradient
                            colors={[Colors.teal, '#1AAF74']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startBtn}>
                            <Ionicons name="play-circle" size={22} color={Colors.white} />
                            <Text style={styles.startBtnText}>Start Jam Session</Text>
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
