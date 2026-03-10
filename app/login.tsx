import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { loginAPI } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        if (!email.trim()) return setError('Vui lòng nhập email.');
        if (!password.trim()) return setError('Vui lòng nhập mật khẩu.');

        try {
            setLoading(true);
            const res = await loginAPI({
                email: email.trim(),
                password: password.trim(),
            });
            console.log('[Login response]', res);

            // Kiểm tra response có đủ token không
            if (res.message === "Account not found!") {
                setError("Tài khoản không tồn tại!");
            } else if (res.message === "Invalid credentials!") {
                setError("Mật khẩu không chính xác!");
            }
            else {
                login(res.accessToken, res.refreshToken);
                router.replace('/(tabs)/home' as any);
            }
        } catch (err: any) {
            setError(err?.message || 'Account not found!');
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

                    {/* ─── LOGO ─── */}
                    <Text style={styles.logo}>AABT</Text>

                    {/* ─── INPUTS ─── */}
                    <View style={styles.form}>
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

                        <TouchableOpacity style={styles.forgotRow}>
                            <Text style={styles.forgotText}>FORGOT PASSWORD</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ─── ERROR BOX ─── */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* ─── LOGIN BUTTON ─── */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={loading}
                        onPress={handleLogin}>
                        <LinearGradient
                            colors={['#33D294', '#7C6FEC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginBtn}>
                            {loading
                                ? <ActivityIndicator color={Colors.white} />
                                : <Text style={styles.loginBtnText}>LOGIN</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ─── DIVIDER ─── */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
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

                    {/* ─── SIGN UP LINK ─── */}
                    <View style={styles.signupRow}>
                        <Text style={styles.signupHint}>DON'T HAVE AN ACCOUNT? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                            <Text style={styles.signupLink}>SIGN UP</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ─── DEV SKIP (xóa khi release) ─── */}
                    <TouchableOpacity
                        style={styles.devSkipBtn}
                        onPress={() => { login(); router.replace('/(tabs)/home'); }}>
                        <Ionicons name="code-slash" size={12} color="#444" />
                        <Text style={styles.devSkipText}>Dev: Skip Login</Text>
                    </TouchableOpacity>

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
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Logo
    logo: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.teal,
        letterSpacing: 6,
        marginBottom: 48,
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
    forgotRow: { alignItems: 'flex-end', marginTop: 10 },
    forgotText: {
        fontSize: 11,
        color: Colors.gray,
        fontWeight: '600',
        letterSpacing: 1,
    },

    // Login button
    loginBtn: {
        width: '100%',
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        minWidth: 300,
    },
    loginBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 3,
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

    // Sign up
    signupRow: { flexDirection: 'row', alignItems: 'center' },
    signupHint: { fontSize: 12, color: Colors.gray, fontWeight: '600' },
    signupLink: { fontSize: 12, color: Colors.teal, fontWeight: '800', letterSpacing: 0.5 },

    // Dev skip button
    devSkipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 24,
        alignSelf: 'center',
        opacity: 0.4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    devSkipText: { fontSize: 11, color: '#666' },

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
        marginBottom: 14,
        width: '100%',
    },
    errorText: { flex: 1, fontSize: 13, color: '#FF6B6B' },
});
