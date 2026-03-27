import { Colors } from '@/constants/theme';
import { updateProfileAPI } from "@/services/profileService";
import { getPresignedUploadUrl, uploadFileToMinIO } from "@/services/storageService";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert, Image, Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function EditProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Khởi tạo state từ tham số truyền vào
    const [displayName, setDisplayName] = useState((params.name as string) || '');
    const [avatarFile, setAvatarFile] = useState<any>(null); // Ảnh mới user vừa chọn
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ảnh hiển thị (ưu tiên ảnh mới chọn, nếu không có thì lấy ảnh cũ từ params)
    const currentPreviewUrl = avatarFile ? avatarFile.uri : (params.avatar as string);

    // Hàm chọn ảnh mới
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1], // Ép cắt 1:1 cho avatar
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setAvatarFile({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `avatar-${Date.now()}.jpg`
            });
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            return Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị!");
        }

        setIsSubmitting(true);
        try {
            let finalAvatarKey = null;

            // Nếu user có chọn ảnh mới -> Phải up lên MinIO
            if (avatarFile) {
                console.log("=> Xin link Presigned cho Avatar mới...");
                const avatarRes = await getPresignedUploadUrl(avatarFile.name, avatarFile.type, "avatars");
                
                console.log("=> Đẩy Avatar mới lên MinIO...");
                console.log(avatarFile.type);
                await uploadFileToMinIO(avatarFile.uri, avatarFile.type, avatarRes.url);
                
                finalAvatarKey = avatarRes.key;
            }

            console.log("=> Gọi API Cập nhật tài khoản...");
            const responseData = await updateProfileAPI({
                displayName: displayName,
                avatarKey: finalAvatarKey // LƯU Ý: Nếu gửi null, báo Backend bỏ qua không cập nhật avatarKey
            });

            console.log("=> Thành công:", responseData);
            Alert.alert("Thành công", "Đã cập nhật hồ sơ!");
            router.replace('/(tabs)/profile' as any); // Chuyển thẳng về trang cá nhân
            
        } catch (error: any) {
            console.log("=> Lỗi cập nhật:", error);
            const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
            Alert.alert("Lỗi", "Không thể cập nhật: " + errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* AVATAR UPLOAD */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {currentPreviewUrl ? (
                            <Image 
                                source={{ uri: currentPreviewUrl }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={50} color={Colors.gray} />
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={16} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarPrompt}>Tap to change avatar</Text>
                </View>

                {/* FORM FIELDS */}
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={Colors.gray}
                        value={displayName}
                        onChangeText={setDisplayName}
                    />
                </View>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                    style={styles.saveBtnWrapper}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    onPress={handleSave}>
                    <LinearGradient
                        colors={['#7C6FEC', '#33D294']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>
                            {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A'
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 60,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#2A2A2A'
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.teal,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000'
    },
    avatarPrompt: {
        marginTop: 12,
        fontSize: 13,
        color: Colors.gray,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    inputWrapper: { marginBottom: 30 },
    input: {
        width: '100%',
        height: 52,
        backgroundColor: '#111',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        paddingHorizontal: 16,
        color: Colors.white,
        fontSize: 15,
    },
    saveBtnWrapper: { width: '100%', marginTop: 10 },
    saveBtn: {
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 1.5,
    },
});
