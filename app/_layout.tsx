import { AuthProvider, useAuth } from '@/context/auth-context';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { jwtDecode } from 'jwt-decode';

import { jwtDecode } from 'jwt-decode';

// Guard: redirect dựa theo trạng thái auth
function AuthGuard() {
    const { isLoggedIn, accessToken } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        // Tránh lỗi "navigate before mount" của Expo Router
        if (!rootNavigationState?.key) return;
        const inAuthGroup = segments[0] === '(tabs)';
        const inAdminGroup = segments[0] === '(admin)';
        const seg0 = segments[0] as string;

        let isAdmin = false;
        if (accessToken) {
            try {
                const decoded: any = jwtDecode(accessToken);
                const role = decoded.role || decoded.roles || decoded.authorities || [];
                isAdmin = Array.isArray(role) 
                    ? role.some((r: string) => r.includes('ADMIN')) 
                    : String(role).includes('ADMIN');
            } catch (e) {
                console.log("Error decoding in AuthGuard:", e);
            }
        }

        if (!isLoggedIn && (inAuthGroup || inAdminGroup)) {
            // Chưa đăng nhập mà cố vào tabs/admin → chuyển về login
            setTimeout(() => router.replace('/login' as any), 0);
        } else if (isLoggedIn && (seg0 === 'login' || seg0 === 'signup' || !seg0)) {
            // Đã đăng nhập mà vào login/signup (hoặc root) → phân luồng
            if (isAdmin) {
                setTimeout(() => router.replace('/(admin)/dashboard' as any), 0);
            } else {
                setTimeout(() => router.replace('/(tabs)/home' as any), 0);
            }
        }
    }, [isLoggedIn, segments, accessToken, rootNavigationState?.key]);

    return null;
}

import { RootSiblingParent } from 'react-native-root-siblings';

export default function RootLayout() {
    return (
        <RootSiblingParent>
            <AuthProvider>
                <AuthGuard />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(admin)" />
                </Stack>
                <StatusBar style="light" />
            </AuthProvider>
        </RootSiblingParent>
    );
}
