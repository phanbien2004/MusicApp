import { AuthProvider, useAuth } from '@/context/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Guard: redirect dựa theo trạng thái auth
function AuthGuard() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const inAuthGroup = segments[0] === '(tabs)';
        const seg0 = segments[0] as string;

        if (!isLoggedIn && inAuthGroup) {
            // Chưa đăng nhập mà cố vào tabs → chuyển về login
            router.replace('/login' as any);
        } else if (isLoggedIn && (seg0 === 'login' || seg0 === 'signup')) {
            // Đã đăng nhập mà vào login/signup → chuyển về home
            router.replace('/(tabs)/home' as any);
        }
    }, [isLoggedIn, segments]);

    return null;
}

export default function RootLayout() {
    return (
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
    );
}
