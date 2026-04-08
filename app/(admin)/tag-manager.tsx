import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllTagsAPI, TagDTO } from '@/services/trackService';
import { createTagAPI, deleteTagAPI, getTagByIdAPI, updateTagAPI } from '@/services/adminService';
import { Colors } from '@/constants/theme';
import Toast from 'react-native-root-toast';

export default function TagManager() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // const [tags, setTags] = useState([
    //     'Lo-fi', 'Electronic', 'Chill', 'Synthwave', 
    //     'HipHop', 'Indie', 'Jazz', 'Techno', 
    //     'Relaxed', 'High Energy', 'Dark', 'Dreamy', 'Nostalgic'
    // ]);
    
    const [tags, setTags] = useState<TagDTO[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal Form
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    
    // Form data
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [parentTagId, setParentTagId] = useState<number | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTags = useCallback(async () => {
        try {
            const data = await getAllTagsAPI();
            setTags(data);
        } catch (error) {
            console.error("Load tags failed:", error);
            Toast.show("Failed to load tags", { duration: Toast.durations.SHORT });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const openCreateModal = () => {
        setIsEditing(false);
        setName('');
        setDisplayName('');
        setDescription('');
        setParentTagId(null);
        setModalVisible(true);
    };

    const openEditModal = async (tag: TagDTO) => {
        setIsEditing(true);
        setCurrentId(tag.id);
        
        // Setup mồi UI trước để tránh cảm giác lag
        setName((tag as any).name || tag.displayName.toUpperCase().replace(/\s+/g, '_'));
        setDisplayName(tag.displayName);
        setDescription(`Vibe for ${tag.displayName}`);
        setParentTagId(null);
        setModalVisible(true);

        try {
            // Lấy thông tin thật từ Backend. Lưu ý: BE cần update TagDTO trả về đủ các field này
            const detailTag = await getTagByIdAPI(tag.id);
            if (detailTag) {
                setName(detailTag.name || tag.displayName.toUpperCase().replace(/\s+/g, '_'));
                setDisplayName(detailTag.displayName || tag.displayName);
                setDescription(detailTag.description || '');
                setParentTagId(detailTag.parentTagId || detailTag.parentTag?.id || null);
            }
        } catch (e) {
            console.error("Lỗi khi fetch tag details", e);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !displayName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên và tên hiển thị");
            return;
        }
        
        setIsSubmitting(true);
        try {
            if (isEditing && currentId) {
                // Truyền thẳng parentTagId (nếu user chọn None thì nó là null)
                await updateTagAPI(currentId, name, displayName, description, parentTagId);
                Toast.show("Tag updated successfully", { duration: Toast.durations.SHORT });
            } else {
                await createTagAPI(name, displayName, description, parentTagId);
                Toast.show("Tag created successfully", { duration: Toast.durations.SHORT });
            }
            setModalVisible(false);
            fetchTags(); // Load lại danh sách sau khi lưu
        } catch (error) {
            Alert.alert("Lỗi", "Không thể xử lý nhãn này.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (tag: TagDTO) => {
        Alert.alert(
            "Xác nhận xóa",
            `Bạn có chắc muốn xóa nhãn "${tag.displayName}"?`,
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteTagAPI(tag.id);
                            setTags(tags.filter(t => t.id !== tag.id));
                            Toast.show("Đã xóa nhãn", { duration: Toast.durations.SHORT });
                        } catch (e) {
                            Alert.alert("Lỗi", "Không thể xóa nhãn.");
                        }
                    } 
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>TAG MANAGER</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={openCreateModal}>
                    <Ionicons name="add" size={28} color={Colors.teal} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Colors.teal} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.tagGrid}>
                        {tags.map((tag) => (
                            <TouchableOpacity 
                                key={tag.id} 
                                style={styles.tagWrapper}
                                onPress={() => openEditModal(tag)}
                                onLongPress={() => confirmDelete(tag)}
                            >
                                <View style={styles.tagPill}>
                                    <Text style={styles.tagText}>{tag.displayName}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <Text style={styles.hintText}>* Bấm vào nhãn để sửa, giữ lâu để xóa</Text>
                </ScrollView>
            )}

            {/* --- MODAL FORM --- */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isEditing ? 'EDIT TAG' : 'CREATE TAG'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <Text style={styles.label}>DATABASE NAME (U-CASE)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={name} 
                                onChangeText={setName} 
                                placeholder="E.g. TECH_NO" 
                                placeholderTextColor="#444" 
                                autoCapitalize="characters"
                            />

                            <Text style={styles.label}>DISPLAY NAME</Text>
                            <TextInput 
                                style={styles.input} 
                                value={displayName} 
                                onChangeText={setDisplayName} 
                                placeholder="E.g. Techno" 
                                placeholderTextColor="#444" 
                            />

                            <Text style={styles.label}>DESCRIPTION</Text>
                            <TextInput 
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                                value={description} 
                                onChangeText={setDescription} 
                                placeholder="Describe this vibe..." 
                                placeholderTextColor="#444" 
                                multiline
                            />

                            <Text style={styles.label}>PARENT TAG (OPTIONAL)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                <TouchableOpacity 
                                    style={[styles.parentTagBtn, parentTagId === null && styles.parentTagBtnActive]}
                                    onPress={() => setParentTagId(null)}
                                >
                                    <Text style={[styles.parentTagText, parentTagId === null && { color: '#000' }]}>None (Root)</Text>
                                </TouchableOpacity>
                                
                                {tags.filter(t => t.id !== currentId).map(t => (
                                    <TouchableOpacity 
                                        key={t.id}
                                        style={[styles.parentTagBtn, parentTagId === t.id && styles.parentTagBtnActive]}
                                        onPress={() => setParentTagId(t.id)}
                                    >
                                        <Text style={[styles.parentTagText, parentTagId === t.id && { color: '#000' }]}>{t.displayName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity 
                                style={[styles.saveBtn, isSubmitting && { opacity: 0.5 }]} 
                                onPress={handleSave} 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>SAVE TAG</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'space-between' },
    backBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    addIconBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    scrollContent: { padding: 20 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tagWrapper: { marginBottom: 8 },
    tagPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.teal, backgroundColor: 'rgba(51, 210, 148, 0.05)' },
    tagText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    hintText: { color: '#444', fontSize: 11, marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContainer: { backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222', overflow: 'hidden', maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    modalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    formContent: { padding: 20 },
    label: { color: '#555', fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
    input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, color: '#FFF', fontSize: 14, marginBottom: 20 },
    saveBtn: { backgroundColor: Colors.teal, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
    
    // Parent Tag Selector
    parentTagBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginRight: 8, backgroundColor: '#111' },
    parentTagBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    parentTagText: { color: '#AAA', fontSize: 13, fontWeight: 'bold' },
});