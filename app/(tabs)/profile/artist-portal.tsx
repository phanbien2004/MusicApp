import { Colors } from '@/constants/theme';
import { ArtistProfileData, getMyArtistProfileAPI } from '@/services/artistService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ArtistPortalScreen() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<ArtistProfileData | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                const res = await getMyArtistProfileAPI();
                if(res !== null) {
                    setProfileData(res);
                    console.log("Fetched Artist Profile: ", res.id);
                    console.log("Fetched Artist Profile Stage Name: ", res.stageName);
                }
                if(profileData?.id && profileData?.stageName) {
                    console.log("Profile Artist ID: ", profileData.id);
                    console.log("Profile Artist Stage Name: ", profileData.stageName);
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy profile artist:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Icons */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile/account-settings' as any)}>
                            <Ionicons name="settings-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Top */}
                <View style={styles.profileTop}>
                    {profileData?.avatarUrl || profileData?.avatarUrl ? (
                         <Image source={{ uri: profileData?.avatarUrl || profileData?.avatarUrl }} style={styles.avatarPlaceholder} />
                    ) : (
                         <View style={[styles.avatarPlaceholder, { alignItems: 'center', justifyContent: 'center'}]}>
                              <Ionicons name="person" size={32} color="#555" />
                         </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profileData?.stageName  || 'Unknown Artist'}</Text>
                        {/* <Text style={styles.profileHandle}>@{(profileData?.artistStageName || profileData?.displayName || 'unknown').toLowerCase().replace(/\s/g, '')}</Text> */}
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{profileData?.followerCount || 0}</Text>
                        <Text style={styles.statLabel}>FANS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{profileData?.followerCount || 0}</Text>
                        <Text style={styles.statLabel}>FRIENDS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>DROPS</Text>
                    </View>
                </View>

                {/* Upload Button */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({
                    pathname: "/profile/upload-track",
                    params: { id: profileData?.id, stageName: profileData?.stageName }
                })}>
                    <LinearGradient
                        colors={['#A855F7', '#3B82F6', '#60A5FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uploadBtn}
                    >
                        <View style={styles.uploadBtnContent}>
                            <Ionicons name="cloud-upload-outline" size={20} color={Colors.black} />
                            <Text style={styles.uploadBtnText}>UPLOAD NEW TRACK</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* My Drops Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Drops</Text>
                </View>

                <View style={[styles.dropsGrid, { alignItems: 'center', justifyContent: 'center', marginTop: 40 }]}>
                    <Text style={{ color: '#555' }}>Chưa có bài hát nào.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    iconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#D9D9D9',
        borderWidth: 1,
        borderColor: '#333'
    },
    profileInfo: {
        gap: 4,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
    },
    profileHandle: {
        fontSize: 14,
        color: '#A0A0A0',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.white,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#A0A0A0',
        letterSpacing: 1,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 24,
        marginBottom: 32,
    },
    uploadBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    uploadBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.black,
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    dropsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
    },
});
