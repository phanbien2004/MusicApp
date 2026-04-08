import MiniPlayer from '@/components/mini-player';
import { Colors } from '@/constants/theme';
import { JamProvider } from '@/context/jam-context';
import { PlayerProvider, usePlayer } from '@/context/player-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentTrackProvider } from '@/context/currentTrack-context';

const MAIN_TABS = ['home', 'search', 'jam', 'profile'];

// Danh sách các màn hình cần ẩn MiniPlayer và giữ sáng Tab Bar cũ
const HIDDEN_SCREENS = [
    'player/currentTrack',
    'notifications',
    'jam/setupjam',
    'jam/joinjam',
    'jam/jamroom',
    'jam/jamnotification',
    'jam/jamsettings',
    'profile/register-artist',
    'profile/addlist',
    'profile/edit-profile',
    'profile/my-subscription',
    'profile/account-settings',
    'profile/artist-portal',
    // 'profile/list',
    'profile/upload-track',
];

function TabLayoutInner() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    // Tất cả màn hình ẩn (href: null) — cần giữ tab cuối sáng
    const HIDDEN_SCREENS = ['player/currentTrack', 'jam/setupjam', 'jam/joinjam', 'notifications', 
    'jam/jamroom', 'jam/jamnotification', 'jam/jamsettings', 'profile/register-artist', 'profile/addlist', 'profile/edit-profile',
    'profile/my-subscription', 'profile/account-settings'];
    const isHiddenScreen = HIDDEN_SCREENS.some(s => pathname.includes(s));

    // Track last active main tab to keep it highlighted when on sub-screens
    const { lastActiveTab, setLastActiveTab } = usePlayer();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <Tabs
                initialRouteName="home"
                screenListeners={{
                    state: (e) => {
                        // Use route state directly — more reliable than parsing target string
                        const state = (e.data as any)?.state;
                        if (!state) return;
                        const activeRoute = state.routes?.[state.index];
                        if (activeRoute && MAIN_TABS.includes(activeRoute.name)) {
                            setLastActiveTab(activeRoute.name);
                        }
                    },
                }}
                tabBar={(props) => {
                    // When on a sub-screen, keep the last active tab highlighted
                    let activeIndex = props.state.index;
                    if (isHiddenScreen && lastActiveTab) {
                        const idx = props.state.routes.findIndex((r) => r.name === lastActiveTab);
                        activeIndex = idx >= 0 ? idx : props.state.index;
                    }

                    const customState = isHiddenScreen
                        ? { ...props.state, index: activeIndex }
                        : props.state;

                    return (
                        <View style={styles.tabBarContainer}>
                            {/* MiniPlayer nằm TRÊN BottomTabBar trong cùng một View cha */}
                            {!isHiddenScreen && <MiniPlayer />}
                            
                            <BottomTabBar {...props} state={customState} />
                        </View>
                    );
                }}
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Colors.teal,
                    tabBarInactiveTintColor: Colors.gray,
                    tabBarStyle: {
                        backgroundColor: Colors.tabBar,
                        borderTopColor: Colors.border,
                        borderTopWidth: 1,
                        // Chiều cao tự động giãn theo thiết bị (né Notch dưới)
                        height: 60 + insets.bottom,
                        paddingBottom: insets.bottom, 
                        paddingTop: 8,
                        elevation: 0,
                        // QUAN TRỌNG: Không dùng absolute để MiniPlayer không bị đè
                        position: 'relative', 
                    },
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.5,
                        marginBottom: 4,
                    },
                }}
            >
                {/* 4 TABS CHÍNH */}
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'HOME',
                        tabBarIcon: ({ color }) => <Ionicons name="home-sharp" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        title: 'SEARCH',
                        tabBarIcon: ({ color }) => <Ionicons name="search-sharp" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="jam"
                    options={{
                        title: 'JAM',
                        tabBarIcon: ({ color }) => <Ionicons name="musical-notes-sharp" size={22} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'PROFILE',
                        tabBarIcon: ({ color }) => <Ionicons name="person-sharp" size={22} color={color} />,
                    }}
                />

                {/* MÀN HÌNH ẨN (Dùng href: null) */}
                <Tabs.Screen name="player/currentTrack" options={{ href: null }} />
                <Tabs.Screen name="notifications" options={{ href: null }} />
                <Tabs.Screen name="jam/setupjam" options={{ href: null }} />
                <Tabs.Screen name="jam/joinjam" options={{ href: null }} />
                <Tabs.Screen name="jam/jamroom" options={{ href: null }} />
                <Tabs.Screen name="jam/jamnotification" options={{ href: null }} />
                <Tabs.Screen name="jam/jamsettings" options={{ href: null }} />
                <Tabs.Screen name="profile/register-artist" options={{ href: null }} />
                <Tabs.Screen name="profile/addlist" options={{ href: null }} />
                <Tabs.Screen name="profile/list" options={{ href: null }} />
                <Tabs.Screen name="profile/edit-profile" options={{ href: null }} />
                <Tabs.Screen name="profile/my-subscription" options={{ href: null }} />
                <Tabs.Screen name="profile/account-settings" options={{ href: null }} />
                <Tabs.Screen name="profile/upload-track" options={{ href: null }} />
                <Tabs.Screen name="profile/artist-portal" options={{ href: null }} />
                <Tabs.Screen name="profile/other-profile" options={{ href: null }} />
            </Tabs>
        </View>
    );
}

export default function TabLayout() {
    return (
        <PlayerProvider>
            <CurrentTrackProvider>
                <JamProvider>
                    <TabLayoutInner />
                </JamProvider>
            </CurrentTrackProvider>
        </PlayerProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    tabBarContainer: {
        backgroundColor: 'transparent',
        // Đảm bảo container này ôm khít vạch điều hướng phía dưới
        width: '100%',
    }
});
