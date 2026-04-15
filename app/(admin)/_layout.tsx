import { Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function AdminLayout() {
    const router = useRouter();
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
            <Stack.Screen 
                name="dashboard" 
            />
            <Stack.Screen 
                name="artist-verification" 
            />
            <Stack.Screen 
                name="applicant-detail" 
            />
            <Stack.Screen 
                name="track-review" 
            />
            <Stack.Screen 
                name="album-review" 
            />
            <Stack.Screen 
                name="album-detail" 
            />
            <Stack.Screen 
                name="tag-manager" 
            />
        </Stack>
    );
}

const styles = StyleSheet.create({
    exitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    exitText: {
        color: '#FF5555',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
