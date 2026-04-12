import React, { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileAPI, ProfileResponse } from '@/services/profileService';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { getMySubscriptionAPI } from '@/services/paymentService';

export default function AccountSettingsScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                getProfileAPI(userId).then(res => setProfileData(res)).catch(console.log);
                getMySubscriptionAPI().then(res => setIsPremium(res?.isActive || false)).catch(console.log);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login' as any);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.content}>
                
                {/* ─── HỒ SƠ ─── */}
                <View style={styles.settingGroup}>
                    <Text style={styles.groupLabel}>PROFILE</Text>
                    <TouchableOpacity 
                        style={styles.settingItem}
                        onPress={() => router.push({
                            pathname: '/(tabs)/profile/edit-profile',
                            params: { 
                                name: profileData?.displayName || '',
                                avatar: profileData?.avatarUrl || ''
                            }
                        } as any)}
                    >
                        <Ionicons name="person-outline" size={20} color={Colors.white} />
                        <Text style={styles.settingText}>Edit Profile</Text>
                        <Ionicons name="pencil" size={16} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                {/* ─── GÓI ĐĂNG KÝ ─── */}
                <View style={styles.settingGroup}>
                    <Text style={styles.groupLabel}>CURRENT SUBSCRIPTION</Text>
                    
                    <View style={styles.premiumBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons 
                                name={isPremium ? 'star' : 'star-outline'} 
                                size={22} 
                                color={isPremium ? '#FFD700' : Colors.gray} 
                            />
                            <View>
                                <Text style={styles.subsTitle}>
                                    {isPremium ? 'PREMIUM ACCOUNT' : 'FREE ACCOUNT'}
                                </Text>
                                <Text style={styles.subsDesc}>
                                    {isPremium ? 'Full access to all features.' : 'Limited free plan'}
                                </Text>
                            </View>
                        </View>
                        
                        {isPremium ? (
                            <TouchableOpacity
                                style={styles.manageBtn}
                                onPress={() => router.push('/(tabs)/profile/my-subscription' as any)}
                            >
                                <Text style={styles.manageBtnText}>Manage</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.upgradeBtn}
                                onPress={() => setShowPremiumModal(true)}
                            >
                                <Text style={styles.upgradeBtnText}>Upgrade</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ─── TÀI KHOẢN ─── */}
                <View style={styles.settingGroup}>
                    <Text style={styles.groupLabel}>APP SETTINGS</Text>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.white} />
                        <Text style={styles.settingText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.white} />
                        <Text style={styles.settingText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
                    </TouchableOpacity>
                </View>

                {/* Nút đăng xuất */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Modal Thanh toán Premium */}
            <PremiumUpgradeModal
                visible={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />
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
    content: {
        padding: 24,
    },
    settingGroup: {
        marginBottom: 32,
    },
    groupLabel: {
        fontSize: 12,
        color: Colors.gray,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        gap: 12,
    },
    settingText: {
        flex: 1,
        fontSize: 15,
        color: Colors.white,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FF6B6B15',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B40',
        marginTop: 20,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    premiumBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 14,
        padding: 16,
    },
    subsTitle: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    subsDesc: {
        color: Colors.gray,
        fontSize: 12,
        marginTop: 4,
    },
    upgradeBtn: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    upgradeBtnText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 12,
    },
    manageBtn: {
        backgroundColor: Colors.teal,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    manageBtnText: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: 12,
    }
});
