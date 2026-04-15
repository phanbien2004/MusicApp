import { addTagAPI, deleteTagAPI } from '@/services/admin/adminService';
import { getAllTagsAPI } from '@/services/trackService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── TYPES ─────────────────────────────────────────────────────────────────
export interface TagDTO {
    id: number;
    displayName: string;
}

// ─── MOCK API SERVICES (Thay thế bằng API thực tế của bạn) ───────────────
// Dựa trên Swagger: GET /api/v1/tag/tags
const fetchTagsAPI = async (): Promise<TagDTO[]> => {
    const tagsData = await getAllTagsAPI();
    return tagsData
};

const addTag = async (name: string) : Promise<TagDTO>=> {
    const addTagData = await addTagAPI(name);
    return addTagData 
};


// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function TagManagerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [tags, setTags] = useState<TagDTO[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load dữ liệu khi component mount
    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            setIsLoading(true);
            const data = await fetchTagsAPI();
            setTags(data);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách Tag.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        
        try {
            setIsSubmitting(true);
            const newTag = await addTag(newTagName.trim());
            setTags([...tags, newTag as TagDTO]);
            setNewTagName(''); // Clear input
        } catch (error) {
            console.error('Failed to add tag:', error);
            Alert.alert('Error', 'Failed to add new tag.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTag = (id: number, name: string) => {
        Alert.alert(
            'Delete Tag',
            `Are you sure you want to delete the tag "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTagAPI(id);
                            setTags(tags.filter(t => t.id !== id));
                        } catch (error) {
                            console.error('Failed to delete tag:', error);
                            Alert.alert('Lỗi', 'Không thể xóa Tag này.');
                        }
                    } 
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top, height: 60 + insets.top }]}>
                <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { marginTop: insets.top + 18 }]}>TAG MANAGER</Text>
            </View>

            <KeyboardAvoidingView 
                style={styles.keyboardAvoiding} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {isLoading ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color="#FFF" />
                    </View>
                ) : (
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Danh sách Tags */}
                        <View style={styles.tagsContainer}>
                            {tags.map((tag) => (
                                <View key={tag.id} style={styles.tagItem}>
                                    <Text style={styles.tagText}>{tag.displayName}</Text>
                                    <TouchableOpacity 
                                        style={styles.deleteIcon} 
                                        onPress={() => handleDeleteTag(tag.id, tag.displayName)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Khu vực thêm Tag mới */}
                        <View style={styles.addTagRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Tên tag mới..."
                                placeholderTextColor="#666"
                                value={newTagName}
                                onChangeText={setNewTagName}
                                onSubmitEditing={handleAddTag}
                            />
                            <TouchableOpacity 
                                style={[styles.addBtn, (!newTagName.trim() || isSubmitting) && styles.addBtnDisabled]} 
                                onPress={handleAddTag}
                                disabled={!newTagName.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.addBtnText}>Add Tag</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505', 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        zIndex: 10,
        paddingBottom: 10,
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // Khoảng cách giữa các tag
        marginBottom: 40,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 20,
        paddingVertical: 10,
        paddingLeft: 16,
        paddingRight: 10,
        backgroundColor: '#111',
    },
    tagText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        marginRight: 6,
    },
    deleteIcon: {
        marginLeft: 2,
    },
    addTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
    },
    input: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 22,
        paddingHorizontal: 16,
        color: '#FFF',
        backgroundColor: '#111',
        fontSize: 14,
    },
    addBtn: {
        height: 44,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#FFF',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    addBtnDisabled: {
        opacity: 0.5,
        borderColor: '#666',
    },
    addBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
});

