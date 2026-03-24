import MiniPlayer from '@/components/mini-player';
import { Colors } from '@/constants/theme';
import { PlayerProvider, usePlayer } from '@/context/player-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentTrackProvider } from '@/context/currentTrack-context';

const MAIN_TABS = ['home', 'search', 'jam', 'profile'];

function TabLayoutInner() {
    const insets = useSafeAreaInsets();
    const tabBarHeight = 60 + insets.bottom;
    const pathname = usePathname();
    // Tất cả màn hình ẩn (href: null) — cần giữ tab cuối sáng
    const HIDDEN_SCREENS = ['player/currentTrack', 'jam/setupjam', 'jam/joinjam', 'notifications', 
    'jam/jamroom', 'jam/jamnotification', 'jam/jamsettings', 'profile/registerartist', 'profile/addlist'];
    const isHiddenScreen = HIDDEN_SCREENS.some(s => pathname.includes(s));

    // Lấy lastActiveTab từ context thay vì local state
    const { lastActiveTab, setLastActiveTab } = usePlayer();

    return (
        <Tabs
            screenListeners={{
                // Mỗi lần focus vào 1 trong 4 tab chính → lưu lại
                focus: (e) => {
                    const routeName = (e.target as string)?.split('-')[0];
                    if (MAIN_TABS.includes(routeName)) {
                        setLastActiveTab(routeName);
                    }
                },
            }}
            tabBar={(props) => {
                // Khi ở màn hình ẩn: giữ tab cuối sáng, ẩn MiniPlayer
                const customState = isHiddenScreen
                    ? {
                        ...props.state,
                        index: props.state.routes.findIndex(
                            (r) => r.name === lastActiveTab
                        ),
                    }
                    : props.state;

                return (
                    <>
                        {!isHiddenScreen && <MiniPlayer />}
                        <BottomTabBar {...props} state={customState} />
                    </>
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
                    height: tabBarHeight,
                    paddingBottom: insets.bottom + 6,
                    paddingTop: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'SEARCH',
                    tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="jam"
                options={{
                    title: 'JAM',
                    tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="player/currentTrack"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="notifications"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="jam/setupjam"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="jam/joinjam"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="jam/jamroom"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="jam/jamnotification"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="jam/jamsettings"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="profile/registerartist"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="profile/addlist"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="profile/list"
                options={{ href: null, headerShown: false }}
            />
        </Tabs>
    );
}

export default function TabLayout() {
    return (
        <PlayerProvider>
            <CurrentTrackProvider>
                <TabLayoutInner />
            </CurrentTrackProvider>
        </PlayerProvider>
    );
}
