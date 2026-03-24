// Base URL từ Swagger
import { BASE_URL } from "@/constants/baseURL";


// ─── Auth API ──────────────────────────────────────────────────────

export interface RefreshResponse{
    userId: number,
    accessToken: string,
    refreshToken: string,
    message: string
}

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}

export interface AuthResponse {
    userId: number,
    accessToken: string | null;
    refreshToken: string | null;
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * POST /api/auth/register
 */
export async function registerAPI(data: RegisterRequest): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const json = await res.json();
    console.log(`Register: ${BASE_URL}/api/v1/auth/register`);

    if (!res.ok) {
        throw new Error(json?.message || `Register failed (${res.status})`);
    }

    return json as AuthResponse;
}

/**
 * POST /api/auth/login 
 */
export async function loginAPI(data: LoginRequest): Promise<AuthResponse> {
    console.log(`Login: ${BASE_URL}/api/v1/auth/login`);
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const json = await res.json();
    console.log("Response Login: ", json);

    if (!res.ok) {
        throw new Error(json?.message || `Login failed (${res.status})`);
    }

    return json as AuthResponse;
}

export async function refreshTokenAPI(refreshToken: string): Promise<RefreshResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST', 
        headers: {
            'Authorization': "Bearer " + refreshToken,
            'Content-Type': 'application/json'
        }
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json?.error || "Refresh token failed");
    }

    return json as RefreshResponse;
}