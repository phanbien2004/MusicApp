// Base URL từ Swagger
export const BASE_URL = 'http://100.97.109.94:7000';

// ─── Auth API ──────────────────────────────────────────────────────

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
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
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json?.message || `Register failed (${res.status})`);
    }

    return json as AuthResponse;
}

/**
 * POST /api/auth/login  (placeholder — thêm khi có swagger login)
 */
export async function loginAPI(data: LoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json?.message || `Login failed (${res.status})`);
    }

    return json as AuthResponse;
}
