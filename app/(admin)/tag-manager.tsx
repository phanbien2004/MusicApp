import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TagManager() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // Quản lý danh sách tag
    const [tags, setTags] = useState([
        'Lo-fi', 'Electronic', 'Chill', 'Synthwave', 
        'HipHop', 'Indie', 'Jazz', 'Techno', 
        'Relaxed', 'High Energy', 'Dark', 'Dreamy', 'Nostalgic'
    ]);
    const [newTag, setNewTag] = useState('');

    // Hàm xóa tag
    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    // Hàm thêm tag mới
    const addTag = () => {
        if (newTag.trim() !== '') {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>TAG MANAGER</Text>
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── TAG GRID ─── */}
                    <View style={styles.tagGrid}>
                        {tags.map((tag, index) => (
                            <View key={index} style={styles.tagWrapper}>
                                <View style={styles.tagPill}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                                {/* Nút X xóa tag */}
                                <TouchableOpacity 
                                    style={styles.deleteIcon} 
                                    onPress={() => removeTag(index)}
                                >
                                    <Ionicons name="close-circle" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* ─── ADD TAG SECTION ─── */}
                    <View style={styles.addSection}>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            value={newTag}
                            onChangeText={setNewTag}
                            placeholderTextColor="#444"
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={addTag}>
                            <Text style={styles.addBtnText}>Add Tag</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 20,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 25,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15, // Khoảng cách giữa các tag
        marginBottom: 40,
    },
    tagWrapper: {
        position: 'relative', // Để icon xóa có thể đè lên
        marginBottom: 8,
    },
    tagPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFF', // Viền trắng mảnh theo ảnh
        minWidth: 80,
        alignItems: 'center',
    },
    tagText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    deleteIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#000', // Nền đen để che bớt viền tag phía dưới
        borderRadius: 10,
    },
    addSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 20,
    },
    input: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 20,
        color: '#FFF',
        backgroundColor: '#000',
    },
    addBtn: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});