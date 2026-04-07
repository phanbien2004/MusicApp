import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { Client } from '@stomp/stompjs';
import { TextDecoder, TextEncoder } from 'text-encoding';

// Polyfill cho React Native
if (!global.TextEncoder) { (global as any).TextEncoder = TextEncoder; }
if (!global.TextDecoder) { (global as any).TextDecoder = TextDecoder; }

export interface JamSession {
    id: number;
    sessionCode: string;
    size: number;
    isPublic: boolean;
}

export interface ResolvedJamSession {
    sessionId?: number;
    sessionCode?: string;
    size?: number;
    isPrivate?: boolean;
}

interface JoinJamPayload {
    jamSessionId?: number;
    jamSessionCode?: string;
}

// --- REST API ---
export const createJamSessionAPI = async (size: number, isPrivate: boolean) => {
    console.log(`POST CREATEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/jam`, {
        size,
        private: isPrivate,
    });
    console.log("Response CreateJamSessionAPI: ", res.data);
    return res.data;
};

export const joinJamSessionByIdAPI = async (jamSessionId: number, jamSessionCode = '') => {
    console.log(`PUT JOINJAMSESSIONBYIDAPI : ${BASE_URL}/api/v1/jam/joinById`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/joinById`, {
        jamSessionId,
        jamSessionCode,
    });
    console.log("Response JoinJamSessionByIdAPI: ", res.data);
    return res.data;
};

export const joinJamSessionByCodeAPI = async (jamSessionCode: string, jamSessionId = 0) => {
    console.log(`PUT JOINJAMSESSIONBYCODEAPI : ${BASE_URL}/api/v1/jam/joinByCode`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/joinByCode`, {
        jamSessionId,
        jamSessionCode,
    });
    console.log("Response JoinJamSessionByCodeAPI: ", res.data);
    return res.data;
};

export const leaveJamSessionAPI = async ({ jamSessionId, jamSessionCode }: JoinJamPayload) => {
    console.log(`PUT LEAVEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/leave`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/leave`, {
        jamSessionId: jamSessionId ?? 0,
        jamSessionCode: jamSessionCode ?? '',
    });
    console.log("Response LeaveJamSessionAPI: ", res.data);
    return res.data;
};

export const deleteJamSessionAPI = async (jamSessionId: number) => {
    console.log(`DELETE DELETEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/${jamSessionId}`);
    const res = await apiClient.delete(`${BASE_URL}/api/v1/jam/${jamSessionId}`);
    console.log("Response DeleteJamSessionAPI: ", res.data);
    return res.data;
};

const getNumericValue = (source: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = source[key];
        const numericValue = typeof value === 'number' ? value : Number(value);

        if (Number.isFinite(numericValue) && numericValue > 0) {
            return numericValue;
        }
    }

    return null;
};

const getStringValue = (source: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = source[key];

        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
};

const getBooleanValue = (source: Record<string, unknown>, key: string) => {
    const value = source[key];

    if (typeof value === 'boolean') {
        return value;
    }

    return undefined;
};

export const resolveJamSession = (payload: unknown, fallbackSessionId?: number): ResolvedJamSession | null => {
    const queue: unknown[] = [payload];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current || typeof current !== 'object' || Array.isArray(current)) {
            continue;
        }

        const source = current as Record<string, unknown>;
        const sessionId = getNumericValue(source, ['jamSessionId', 'sessionId', 'id']);

        const resolvedSessionCode = getStringValue(source, ['sessionCode', 'code', 'jamSessionCode']);
        const isPrivate = getBooleanValue(source, 'isPrivate');
        const isPublic = getBooleanValue(source, 'isPublic');

        if (sessionId || resolvedSessionCode) {
            return {
                sessionId: sessionId ?? (fallbackSessionId && fallbackSessionId > 0 ? fallbackSessionId : undefined),
                sessionCode: resolvedSessionCode,
                size: getNumericValue(source, ['size']) ?? undefined,
                isPrivate: isPrivate ?? (typeof isPublic === 'boolean' ? !isPublic : undefined),
            };
        }

        for (const key of ['data', 'result', 'jamSession', 'session']) {
            if (source[key]) {
                queue.push(source[key]);
            }
        }
    }

    if (fallbackSessionId && fallbackSessionId > 0) {
        return { sessionId: fallbackSessionId };
    }

    return null;
};

// --- WEBSOCKET LOGIC ---
export const createStompClient = (accessToken: string) => {
    const wsUrl = BASE_URL.replace("http", "ws") + "/ws";
    
    return new Client({
        brokerURL: wsUrl,
        connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
        },
        debug: (str) => console.log('STOMP:', str),
        reconnectDelay: 5000,
    });
};

// Gửi lời mời cho danh sách ID bạn bè
export const inviteFriendsAPI = async (jamSessionId: number, memberIds: number[]) => {
    console.log(`POST INVITEFRIENDSAPI : ${BASE_URL}/api/v1/jam/invite`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/jam/invite`, {
        jamSessionId,
        memberIds
    });
    console.log("Response InviteFriendsAPI: ", res.data);
    return res.data;
};

// Cập nhật cấu hình phòng (Privacy/Size)
export const updateJamSessionAPI = async (jamSessionId: number, size: number, isPublic: boolean) => {
    console.log(`PUT UPDATEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/update`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/update`, {
        jamSessionId,
        size,
        isPublic
    });
    console.log("Response UpdateJamSessionAPI: ", res.data);
    return res.data;
};
