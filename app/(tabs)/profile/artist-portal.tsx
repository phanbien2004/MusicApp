import { Colors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ArtistPortalScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Icons */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-social-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="settings-outline" size={22} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Top */}
                <View style={styles.profileTop}>
                    <View style={styles.avatarPlaceholder} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Bien - MTP</Text>
                        <Text style={styles.profileHandle}>@bienne</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>12k</Text>
                        <Text style={styles.statLabel}>FANS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>20</Text>
                        <Text style={styles.statLabel}>FRIENDS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>42</Text>
                        <Text style={styles.statLabel}>DROPS</Text>
                    </View>
                </View>

                {/* Upload Button */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(tabs)/profile/upload-track' as any)}>
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

                <View style={styles.dropsGrid}>
                    <View style={styles.dropCard}>
                        <View style={styles.dropThumb} />
                        <Text style={styles.dropName}>Song 1</Text>
                    </View>
                    <View style={styles.dropCard}>
                        <View style={styles.dropThumb} />
                        <Text style={styles.dropName}>Song 2</Text>
                    </View>
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
    dropCard: {
        flex: 1,
        gap: 8,
    },
    dropThumb: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        backgroundColor: '#D9D9D9',
    },
    dropName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.white,
        textAlign: 'center',
    },
});
