import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { registerAPI } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-root-toast';

export default function SignupScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError('');
        if (!username.trim()) return setError('Please enter username.');
        if (!email.trim()) return setError('Please enter email.');
        if (!password.trim()) return setError('Please enter password.');
        if (password !== confirmPassword) return setError('Passwords do not match.');
        if (!agreed) return setError('You must agree to the terms.');

        try {
            setLoading(true);
            const res = await registerAPI({
                email: email.trim(),
                password: password.trim(),
                displayName: username.trim(),
            });
            if (res.message === "Account already exists!") {
                setError("Email already exists!")
            } else {
                if (res.accessToken && res.refreshToken) {
                    await AsyncStorage.setItem('accessToken', res.accessToken);
                    await AsyncStorage.setItem('refreshToken', res.refreshToken);
                    if(res.userId) await AsyncStorage.setItem('userId', JSON.stringify(res.userId));
                    login(res.accessToken, res.refreshToken);
                    
                    try {
                        const decoded: any = jwtDecode(res.accessToken);
                        const role = decoded.role || decoded.roles || decoded.authorities || [];
                        const isAdmin = Array.isArray(role) 
                            ? role.some((r: string) => r.includes('ADMIN')) 
                            : String(role).includes('ADMIN');

                        Toast.show('Register Successfully!', { duration: Toast.durations.SHORT });

                        if (isAdmin) {
                            router.replace('/(admin)/dashboard' as any);
                        } else {
                            setTimeout(() => {
                                router.replace('/(tabs)/home' as any);
                            }, 1000);
                        }
                    } catch (e) {
                         Toast.show('Register Successfully!', { duration: Toast.durations.SHORT });
                         setTimeout(() => { router.replace('/(tabs)/home' as any); }, 1000);
                    }
                }
            }

        } catch (err: any) {
            setError(err?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled">

                    {/* ─── BACK + TITLE ─── */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.title}>CREATE ACCOUNT</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ─── INPUTS ─── */}
                    <View style={styles.form}>
                        <Text style={styles.label}>USERNAME</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                placeholderTextColor="transparent"
                            />
                        </View>

                        <Text style={styles.label}>EMAIL</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="transparent"
                            />
                        </View>

                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { paddingRight: 48 }]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="transparent"
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={Colors.gray}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>CONFIRM PASSWORD</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { paddingRight: 48 }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="transparent"
                            />
                        </View>

                        {/* ─── TERMS CHECKBOX ─── */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.8}>
                            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                                {agreed && <Ionicons name="checkmark" size={14} color="#000" />}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text style={styles.termsLink}>Term of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ─── ERROR MESSAGE ─── */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* ─── CREATE ACCOUNT BUTTON ─── */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={loading}
                        onPress={handleRegister}>
                        <LinearGradient
                            colors={['#33D294', '#7C6FEC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.createBtn}>
                            {loading
                                ? <ActivityIndicator color={Colors.white} />
                                : <Text style={styles.createBtnText}>CREATE ACCOUNT</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ─── DIVIDER ─── */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* ─── GOOGLE ─── */}
                    <TouchableOpacity style={styles.googleBtn}>
                        <Image
                            source={require('@/assets/images/google-icon.png')}
                            style={styles.googleIconImg}
                        />
                        <Text style={styles.googleText}>GOOGLE</Text>
                    </TouchableOpacity>

                    {/* ─── LOGIN LINK ─── */}
                    <View style={styles.loginRow}>
                        <Text style={styles.loginHint}>ALREADY HAVE AN ACCOUNT? </Text>
                        <TouchableOpacity onPress={() => router.push('/login' as any)}>
                            <Text style={styles.loginLink}>LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 20,
        paddingBottom: 40,
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1A1A1A',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#2A2A2A',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 1.5,
    },

    // Form
    form: { width: '100%', marginBottom: 24 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.gray,
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 16,
    },
    inputWrapper: {
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        width: '100%',
        height: 52,
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        paddingHorizontal: 16,
        color: Colors.white,
        fontSize: 15,
    },
    eyeBtn: {
        position: 'absolute',
        right: 14,
        padding: 4,
    },

    // Terms
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 18,
        gap: 12,
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 1.5, borderColor: '#444',
        alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
    },
    checkboxChecked: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    termsText: { flex: 1, fontSize: 13, color: Colors.gray, lineHeight: 20 },
    termsLink: { color: Colors.teal, fontWeight: '600' },

    // Create button
    createBtn: {
        width: '100%',
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 2,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        gap: 10,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
    dividerText: { fontSize: 11, color: Colors.gray, fontWeight: '600', letterSpacing: 1 },

    // Google
    googleBtn: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    googleIconImg: { width: 22, height: 22, resizeMode: 'contain' },
    googleText: { fontSize: 14, fontWeight: '700', color: Colors.white, letterSpacing: 1 },

    // Login link
    loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    loginHint: { fontSize: 12, color: Colors.gray, fontWeight: '600' },
    loginLink: { fontSize: 12, color: Colors.teal, fontWeight: '800', letterSpacing: 0.5 },

    // Error
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2A1111',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF6B6B44',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: '#FF6B6B' },
});
