import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-root-toast';

export default function JamInviteSheet({
    jamId,
    sessionCode,
    isHost,
    query,
    setQuery,
    loading,
    results,
    invitedIds,
    setInvitedIds,
    submitting,
    onSendInvites,
    onSearch
}: any) {

    // Logic Tự động Search khi gõ (Debounce 500ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                onSearch(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(sessionCode || jamId);
        Toast.show('Code copied!', {
            position: Toast.positions.CENTER,
            backgroundColor: Colors.teal,
        });
    };

    const toggleSelect = (id: string) => {
        const next = new Set(invitedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setInvitedIds(next);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sheetTitle}>Invite members to your Jam</Text>

            {/* PHẦN HIỂN THỊ CODE MỜI */}
            <TouchableOpacity style={styles.codeContainer} onPress={copyToClipboard} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>JAM CODE (Tap to copy)</Text>
                    <Text style={styles.codeValue}>{sessionCode || jamId}</Text>
                </View>
                <Ionicons name="copy-outline" size={20} color={Colors.teal} />
            </TouchableOpacity>

            {!isHost ? (
                <View style={styles.centerContent}>
                    <Ionicons name="lock-closed" size={32} color="#333" />
                    <Text style={styles.helperText}>Only the host can send direct invitations.</Text>
                </View>
            ) : (
                <>
                    {/* Ô TÌM KIẾM */}
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search" size={18} color="#666" style={{ marginLeft: 12 }} />
                        <TextInput
                            style={styles.inviteSearchInput}
                            placeholder="Search friends by name..."
                            placeholderTextColor="#555"
                            value={query}
                            onChangeText={setQuery}
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} style={{ marginRight: 10 }}>
                                <Ionicons name="close-circle" size={18} color="#444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* DANH SÁCH KẾT QUẢ */}
                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator color={Colors.teal} />
                            <Text style={styles.loadingText}>Searching...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            renderItem={({ item }) => {
                                const isSelected = invitedIds.has(item.id.toString());
                                return (
                                    <TouchableOpacity
                                        style={[styles.memberRow, isSelected && styles.selectedRow]}
                                        onPress={() => toggleSelect(item.id.toString())}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.avatarBox}>
                                            {item.avatarUrl ? (
                                                <Image source={{ uri: item.avatarUrl }} style={styles.fullImg} />
                                            ) : (
                                                <Text style={styles.avatarInitial}>
                                                    {item.name?.charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.memberMeta}>
                                            <Text style={styles.memberName}>{item.name}</Text>
                                            <Text style={styles.memberSub}>
                                                {item.friendStatus === 'ACCEPTED' ? '• Friend' : '• User'}
                                            </Text>
                                        </View>

                                        <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                query.trim() ? (
                                    <Text style={styles.helperText}>No users found.</Text>
                                ) : (
                                    <Text style={styles.helperText}>Type to find members...</Text>
                                )
                            }
                        />
                    )}

                    {/* NÚT GỬI LỜI MỜI */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, (!invitedIds.size || submitting) && styles.disabledBtn]}
                        onPress={onSendInvites}
                        disabled={!invitedIds.size || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryBtnText}>
                                Send Invitations {invitedIds.size > 0 ? `(${invitedIds.size})` : ''}
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 16 },
    
    codeContainer: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', 
        borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' 
    },
    codeLabel: { fontSize: 10, color: Colors.teal, fontWeight: '800', marginBottom: 4 },
    codeValue: { fontSize: 16, color: '#FFF', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    searchWrapper: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', 
        borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#222' 
    },
    inviteSearchInput: { flex: 1, height: 45, paddingHorizontal: 10, color: '#FFF', fontSize: 14 },
    
    memberRow: { 
        flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#111', 
        borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' 
    },
    selectedRow: { borderColor: 'rgba(0, 150, 136, 0.3)', backgroundColor: '#181818' },
    avatarBox: { 
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A2A', 
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center' 
    },
    avatarInitial: { color: Colors.teal, fontWeight: 'bold', fontSize: 16 },
    memberMeta: { flex: 1, marginLeft: 12 },
    memberName: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    memberSub: { color: '#555', fontSize: 11, marginTop: 2 },
    
    checkCircle: { 
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, 
        borderColor: '#333', alignItems: 'center', justifyContent: 'center' 
    },
    checkCircleSelected: { backgroundColor: Colors.teal, borderColor: Colors.teal },

    primaryBtn: { 
        height: 50, borderRadius: 12, backgroundColor: Colors.teal, 
        alignItems: 'center', justifyContent: 'center', marginTop: 10 
    },
    disabledBtn: { opacity: 0.5, backgroundColor: '#333' },
    primaryBtnText: { color: '#FFF', fontWeight: '700' },
    fullImg: { width: '100%', height: '100%' },
    helperText: { color: '#555', textAlign: 'center', paddingVertical: 20 },
    centerContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
    loadingBox: { alignItems: 'center', paddingVertical: 20 },
    loadingText: { color: '#888', marginTop: 8, fontSize: 12 }
});