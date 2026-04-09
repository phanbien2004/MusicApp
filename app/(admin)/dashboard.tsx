import { Colors } from '@/constants/theme'; // Đảm bảo bạn có file theme này
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard() {
    const router = useRouter();

    const menuItems = [
        {
            title: 'ARTIST VERIFICATION',
            subtitle: '84 APPLICANTS',
            icon: 'person-add-outline',
            route: '/(admin)/artist-verification', 
        },
        {
            title: 'TRACK REVIEW',
            subtitle: '124 NEW UPLOAD',
            icon: 'musical-notes-outline',
            route: '/(admin)/track-review',
        },
        {
            title: 'TAG MANAGER',
            subtitle: '',
            icon: 'pricetag-outline',
            route: '/(admin)/tag-manager',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <View style={styles.headerBorder}>
                        <Text style={styles.headerTitle}>ADMIN CONTROL</Text>
                        <Text style={styles.headerBrand}>AABT</Text>
                    </View>
                </View>

                {/* ─── MENU ITEMS ─── */}
                <View style={styles.menuList}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.card}
                            onPress={() => item.route && router.push(item.route as any)}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon as any} size={24} color={Colors.teal} />
                            </View>
                            
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}
                            </View>

                            <Ionicons name="chevron-forward" size={20} color="#555" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Nút Đăng xuất cho Admin */}
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={async () => {
                        await AsyncStorage.removeItem('accessToken');
                        await AsyncStorage.removeItem('refreshToken');
                        router.replace('/login');
                    }}
                >
                    <Text style={styles.logoutText}>Exit Admin Mode</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Nền đen theo ảnh
    },
    content: {
        padding: 24,
    },
    header: {
        marginTop: 40,
        marginBottom: 60,
    },
    headerBorder: {
        padding: 10,
        alignSelf: 'flex-start',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerBrand: {
        color: '#00A8A8',
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuList: {
        gap: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212', // Màu xám rất tối cho card
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1A2A2A', // Nền icon hơi xanh tối
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cardSubtitle: {
        color: '#777',
        fontSize: 11,
        marginTop: 4,
    },
    logoutBtn: {
        marginTop: 100,
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
    },
    logoutText: {
        color: '#FF5555',
        fontWeight: 'bold',
    }
});