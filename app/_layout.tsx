import { AuthProvider, useAuth } from '@/context/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { jwtDecode } from 'jwt-decode';

// Guard: redirect dựa theo trạng thái auth
function AuthGuard() {
    const { isLoggedIn, accessToken } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const inAuthGroup = segments[0] === '(tabs)';
        const inAdminGroup = segments[0] === '(admin)';
        const seg0 = segments[0] as string;

        if (!isLoggedIn && (inAuthGroup || inAdminGroup)) {
            // Chưa đăng nhập mà cố vào tabs hoặc admin → chuyển về login
            router.replace('/login' as any);
        } else if (isLoggedIn && (seg0 === 'login' || seg0 === 'signup')) {
            // Đã đăng nhập mà vào login/signup → kiểm tra role để chuyển về home / admin
            let isAdmin = false;
            try {
                if (accessToken) {
                    const decoded: any = jwtDecode(accessToken);
                    const role = decoded.role || decoded.roles || decoded.authorities || [];
                    isAdmin = Array.isArray(role) 
                        ? role.some((r: string) => r.includes('ADMIN')) 
                        : String(role).includes('ADMIN');
                }
            } catch (e) {
                console.log("JWT decode error in AuthGuard:", e);
            }

            if (isAdmin) {
                router.replace('/(admin)/dashboard' as any);
            } else {
                router.replace('/(tabs)/home' as any);
            }
        }
    }, [isLoggedIn, segments, accessToken, router]);

    return null;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <AuthGuard />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000' },
                    gestureEnabled: true,
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen
                    name="login"
                    options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                    name="signup"
                    options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen name="(admin)" />
            </Stack>
            <StatusBar style="light" />
        </AuthProvider>
    );
}
