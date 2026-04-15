import MiniPlayer from "@/components/mini-player";
import { Colors } from "@/constants/theme";
import { JamProvider } from "@/context/jam-context";
import { PlayerProvider, usePlayer } from "@/context/player-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { Tabs, usePathname } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrentTrackProvider } from "@/context/currentTrack-context";
import { NotificationProvider } from "@/context/notification-context";

const MAIN_TABS = ["home", "search", "jam", "profile"];

// Danh sách các màn hình cần ẩn MiniPlayer
const HIDDEN_SCREENS = [
  "player/currentTrack",
  "notifications",
  "jam/setupjam",
  "jam/joinjam",
  "jam/jamroom",
  "profile/register-artist",
  "profile/addlist",
  "profile/edit-profile",
  "profile/my-subscription",
  "profile/account-settings",
  "profile/artist-portal",
  "profile/artist-profile",
  // 'profile/list',
  "profile/upload-track",
];

// Map route name → main tab cần sáng
// Dùng route name (từ navigation state) thay vì pathname vì đây là nguồn đáng tin cậy nhất
function resolveTabForRoute(routeName: string, lastActiveTab: string): string {
  if (MAIN_TABS.includes(routeName)) return routeName;
  if (routeName.startsWith("jam/"))     return "jam";
  if (routeName.startsWith("profile/")) return "profile";
  if (routeName.startsWith("album/"))   return "home";
  // notifications, player/currentTrack → giữ tab cuối người dùng bấm
  return lastActiveTab;
}

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isHiddenScreen = HIDDEN_SCREENS.some((s) => pathname.includes(s));

  const { lastActiveTab, setLastActiveTab } = usePlayer();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Tabs
        initialRouteName="home"
        screenListeners={{
          state: (e) => {
            const state = (e.data as any)?.state;
            if (!state) return;
            const activeRoute = state.routes?.[state.index];
            if (!activeRoute) return;
            const routeName: string = activeRoute.name;
            // Cập nhật lastActiveTab cho cả main tabs và sub-screens
            // để luôn biết tab nào đang được dùng
            if (MAIN_TABS.includes(routeName)) {
              setLastActiveTab(routeName);
            } else if (routeName.startsWith("jam/")) {
              setLastActiveTab("jam");
            } else if (routeName.startsWith("profile/")) {
              setLastActiveTab("profile");
            } else if (routeName.startsWith("album/")) {
              setLastActiveTab("home");
            }
            // notifications và player/currentTrack: không cập nhật → giữ tab cũ
          },
        }}
        tabBar={(props) => {
          const activeIndex = props.state.index;
          const activeRouteName = props.state.routes[activeIndex]?.name ?? "";

          // Tính tab nào cần sáng dựa vào route name (đồng bộ, đáng tin cậy)
          const targetTabName = resolveTabForRoute(activeRouteName, lastActiveTab);
          const targetIndex = props.state.routes.findIndex(
            (r) => r.name === targetTabName
          );
          const customIndex = targetIndex >= 0 ? targetIndex : activeIndex;
          const customState = { ...props.state, index: customIndex };

          return (
            <View style={styles.tabBarContainer}>
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
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            elevation: 0,
            position: "relative",
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.5,
            marginBottom: 4,
          },
        }}
      >
        {/* 4 TABS CHÍNH */}
        <Tabs.Screen
          name="home"
          options={{
            title: "HOME",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-sharp" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "SEARCH",
            tabBarIcon: ({ color }) => (
              <Ionicons name="search-sharp" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jam"
          options={{
            title: "JAM",
            tabBarIcon: ({ color }) => (
              <Ionicons name="musical-notes-sharp" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "PROFILE",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-sharp" size={22} color={color} />
            ),
          }}
        />

        {/* MÀN HÌNH ẨN */}
        <Tabs.Screen name="player/currentTrack" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="jam/setupjam" options={{ href: null }} />
        <Tabs.Screen name="jam/joinjam" options={{ href: null }} />
        <Tabs.Screen name="jam/jamroom" options={{ href: null }} />
        <Tabs.Screen name="jam/jamInviteSheet" options={{ href: null }} />
        <Tabs.Screen name="jam/jamNotificationSheet" options={{ href: null }} />
        <Tabs.Screen name="jam/jamSettingSheet" options={{ href: null }} />
        <Tabs.Screen name="profile/register-artist" options={{ href: null }} />
        <Tabs.Screen name="profile/addlist" options={{ href: null }} />
        <Tabs.Screen name="profile/list" options={{ href: null }} />
        <Tabs.Screen name="profile/edit-profile" options={{ href: null }} />
        <Tabs.Screen name="profile/my-subscription" options={{ href: null }} />
        <Tabs.Screen name="profile/account-settings" options={{ href: null }} />
        <Tabs.Screen name="profile/upload-track" options={{ href: null }} />
        <Tabs.Screen name="profile/artist-portal" options={{ href: null }} />
        <Tabs.Screen name="profile/artist-profile" options={{ href: null }} />
        <Tabs.Screen name="profile/other-profile" options={{ href: null }} />
        <Tabs.Screen name="album/album" options={{ href: null }} />
        <Tabs.Screen name="profile/upload-album" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  return (
    <PlayerProvider>
      <JamProvider>
        <CurrentTrackProvider>
          <NotificationProvider>
            <TabLayoutInner />
          </NotificationProvider>
        </CurrentTrackProvider>
      </JamProvider>
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  tabBarContainer: {
    backgroundColor: "transparent",
    width: "100%",
  },
});
