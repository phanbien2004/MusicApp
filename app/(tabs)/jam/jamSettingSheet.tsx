import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function JamSettingsSheet({ isHost, privacyMode, setPrivacyMode, maxPeople, onShowPicker, showPeoplePicker, peopleCounts, onSelectPeople, onSave, onFinish, submitting }: any) {
    return (
        <View>
            <Text style={styles.sheetTitle}>Jam Settings</Text>
            
            <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} />
                    <Text style={styles.settingLabel}>Privacy Mode</Text>
                </View>
                <Switch value={privacyMode} onValueChange={setPrivacyMode} disabled={!isHost} />
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={onShowPicker} disabled={!isHost}>
                <View style={styles.settingLeft}>
                    <Ionicons name="people-outline" size={20} color={Colors.gray} />
                    <Text style={styles.settingLabel}>Max People</Text>
                </View>
                <Text style={{color:Colors.teal, fontWeight: '700'}}>{maxPeople}</Text>
            </TouchableOpacity>

            {showPeoplePicker && (
                <View style={styles.pickerDropdown}>
                    {peopleCounts.map((c: string) => (
                        <TouchableOpacity key={c} style={styles.pickerOption} onPress={() => onSelectPeople(c)}>
                            <Text style={{color:'#FFF', textAlign: 'center'}}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {isHost && (
                <TouchableOpacity style={styles.primarySheetBtn} onPress={onSave} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primarySheetBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
                <Text style={styles.finishText}>{isHost ? 'End Jam' : 'Leave Jam'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 16 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingLabel: { color: '#FFF', fontWeight: '600' },
    pickerDropdown: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    pickerOption: { padding: 12, minWidth: 50 },
    primarySheetBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    primarySheetBtnText: { color: '#FFF', fontWeight: '700' },
    finishBtn: { height: 50, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    finishText: { color: '#FF5555', fontWeight: '700' }
});