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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const avatarColors = ['#555', '#6D28D9', '#4C1D95'];
const peopleCounts = ['02', '04', '06', '08', '10'];

export default function JamSettingsScreen() {
    const router = useRouter();
    const [privacyMode, setPrivacyMode] = useState(false);
    const [maxPeople, setMaxPeople] = useState('04');
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ─── HEADER CARD (teal border) ─── */}
            <View style={styles.headerCard}>
                <View style={styles.headerInner}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="people" size={20} color={Colors.teal} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Live Jam Session</Text>
                        <Text style={styles.headerSub}>Synchronized with 4 others</Text>
                    </View>
                </View>
            </View>

            {/* ─── AVATAR + ACTION ICONS ─── */}
            <View style={styles.actionRow}>
                <View style={styles.avatarsGroup}>
                    {avatarColors.map((color, i) => (
                        <View key={i} style={[styles.memberAvatar, { backgroundColor: color, marginLeft: i > 0 ? -10 : 0 }]} />
                    ))}
                </View>
                <View style={styles.iconsGroup}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push('/(tabs)/jamroom' as any)}>
                        <Ionicons name="person-add-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => router.push('/(tabs)/jamnotification' as any)}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colors.teal + '33' }]}>
                        <Ionicons name="settings-outline" size={20} color={Colors.teal} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── SETTINGS CARD ─── */}
            <View style={styles.settingsCard}>
                {/* Privacy Mode */}
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

                <View style={styles.sectionDivider} />

                {/* Max people */}
                <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => setShowPeoplePicker(!showPeoplePicker)}>
                    <Text style={styles.settingLabel}>Maximum number of people</Text>
                    <View style={styles.pickerValue}>
                        <Text style={styles.pickerText}>{maxPeople}</Text>
                        <Ionicons
                            name={showPeoplePicker ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={Colors.gray}
                        />
                    </View>
                </TouchableOpacity>

                {showPeoplePicker && (
                    <View style={styles.pickerDropdown}>
                        {peopleCounts.map(count => (
                            <TouchableOpacity
                                key={count}
                                style={[
                                    styles.pickerOption,
                                    maxPeople === count && styles.pickerOptionActive,
                                ]}
                                onPress={() => {
                                    setMaxPeople(count);
                                    setShowPeoplePicker(false);
                                }}>
                                <Text style={[
                                    styles.pickerOptionText,
                                    maxPeople === count && { color: Colors.teal },
                                ]}>
                                    {count}
                                </Text>
                                {maxPeople === count && (
                                    <Ionicons name="checkmark" size={16} color={Colors.teal} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* ─── FINISH JAM ─── */}
            <TouchableOpacity
                style={styles.finishBtn}
                onPress={() => router.push('/(tabs)/jam' as any)}>
                <Text style={styles.finishText}>Finish Jam</Text>
            </TouchableOpacity>

            {/* ─── CURRENT SONG INFO ─── */}
            <View style={styles.currentSongBox}>
                <Text style={styles.currentSongTitle}>Em của ngày hôm qua</Text>
                <Text style={styles.currentSongArtist}>Sơn Tùng MTP</Text>
                <Text style={styles.jammingTo}>Jamming to: MTP</Text>
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

    // Header card
    headerCard: {
        margin: 16,
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.teal,
        padding: 14,
    },
    headerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: {
        width: 42, height: 42, borderRadius: 10,
        backgroundColor: '#0F2D24',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.teal,
    },
    headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
    headerSub: { fontSize: 12, color: Colors.gray, marginTop: 2 },

    // Action row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    avatarsGroup: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#000' },
    iconsGroup: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },

    // Settings card
    settingsCard: {
        marginHorizontal: 16,
        backgroundColor: '#111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E1E1E',
        overflow: 'hidden',
        marginBottom: 14,
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIconWrapper: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },
    settingDesc: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    sectionDivider: { height: 1, backgroundColor: '#1A1A1A', marginHorizontal: 16 },
    pickerValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pickerText: { fontSize: 15, fontWeight: '700', color: Colors.white },
    pickerDropdown: {
        borderTopWidth: 1, borderColor: '#1A1A1A',
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    pickerOptionActive: { backgroundColor: '#0F2D24' },
    pickerOptionText: { fontSize: 14, color: Colors.gray },

    // Finish button
    finishBtn: {
        marginHorizontal: 16,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
        marginBottom: 20,
    },
    finishText: { fontSize: 15, fontWeight: '700', color: Colors.white },

    // Current song
    currentSongBox: {
        alignItems: 'center',
        gap: 4,
    },
    currentSongTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
    currentSongArtist: { fontSize: 13, color: Colors.gray },
    jammingTo: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
});
