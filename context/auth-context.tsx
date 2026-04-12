import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ACCESS_TOKEN_STORAGE_KEY,
    ACTIVE_JAM_STORAGE_KEY,
    REFRESH_TOKEN_STORAGE_KEY,
    USER_ID_STORAGE_KEY,
} from '@/constants/storageKeys';

interface AuthContextType {
    isLoggedIn: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    login: (accessToken?: string, refreshToken?: string) => void;
    logout: () => Promise<void>;
    newToken: (accessToken?: string, refreshToken?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    accessToken: null,
    refreshToken: null,
    login: () => { },
    logout: async () => { },
    newToken : () => { }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    const login = (aToken?: string, rToken?: string) => {
        setIsLoggedIn(true);
        if (aToken) setAccessToken(aToken);
        if (rToken) setRefreshToken(rToken);
    };

    const logout = async () => {
        // Clear local state first so AuthGuard can redirect quickly.
        setIsLoggedIn(false);
        setAccessToken(null);
        setRefreshToken(null);

        // Also clear persisted tokens + active jam so user doesn't re-enter jam after logging out.
        try {
            await AsyncStorage.multiRemove([
                ACCESS_TOKEN_STORAGE_KEY,
                REFRESH_TOKEN_STORAGE_KEY,
                USER_ID_STORAGE_KEY,
                ACTIVE_JAM_STORAGE_KEY,
            ]);
        } catch (error) {
            console.log('Logout storage cleanup failed:', error);
        }
    };

    const newToken = (aToken?: string, rToken?: string) => {
        if (aToken) setAccessToken(aToken);
        if (rToken) setRefreshToken(rToken);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, accessToken, refreshToken, login, logout, newToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
