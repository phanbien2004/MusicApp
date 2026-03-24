import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    login: (accessToken?: string, refreshToken?: string) => void;
    logout: () => void;
    newToken: (accessToken?: string, refreshToken?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    accessToken: null,
    refreshToken: null,
    login: () => { },
    logout: () => { },
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

    const logout = () => {
        setIsLoggedIn(false);
        setAccessToken(null);
        setRefreshToken(null);
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
