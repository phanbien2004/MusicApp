// import apiClient from "@/api/apiClient";
// import { BASE_URL } from "@/constants/baseURL";
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';

import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { TextDecoder, TextEncoder } from 'text-encoding';

if (!global.TextEncoder) { (global as any).TextEncoder = TextEncoder; }
if (!global.TextDecoder) { (global as any).TextDecoder = TextDecoder; }

export interface CreateJamPayLoad {
    size: number,
    isPrivate: boolean
}

interface CreateJamResponse {
    id: number;
    code: string;
}

interface JoinJamPayload {
    jamSessionId?: number;
    jamSessionCode?: string;
}

export interface UpdateJamPayload {
    jamSessionId: number;
    size: number;
    isPublic: boolean;
}



interface LeaveJamPayload {
    jamSessionId?: number;
    jamSessionCode?: string;
}

export const createJamSessionAPI = async (dataPayLoad: CreateJamPayLoad) : Promise<CreateJamResponse> => {
    console.log(`POST CREATEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/jam`, {
        size: dataPayLoad.size,
        isPrivate: dataPayLoad.isPrivate
    });
    console.log("Response CreateJamSessionAPI: ", res.data);
    return res.data
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
    console.log("Payload JoinJamSessionByCodeAPI: ", { jamSessionId, jamSessionCode });
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/joinByCode`, {
        jamSessionId,
        jamSessionCode,
    });
    console.log("Response JoinJamSessionByCodeAPI: ", res.data);
    return res.data;
};

export const leaveJamSessionAPI = async ({ jamSessionId, jamSessionCode }: LeaveJamPayload) => {
    console.log(`PUT LEAVEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/leave`);
    console.log("Payload LeaveJamSessionAPI: ", { jamSessionId, jamSessionCode });
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
}

export const updateJamSessionAPI = async (data: UpdateJamPayload) => {
    console.log(`PUT UPDATEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/update`);
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam/update`, {
        jamSessionId: data.jamSessionId,
        size: data.size,
        isPublic: data.isPublic
    });
    console.log("Response UpdateJamSessionAPI: ", res.data);
    return res.data;
};

export interface acceptNotificationRequestDTO  {
    jamId: number | undefined;
    jamNotificationId: number,
    trackId: number,
    interactionType: "SAVED" | "PLAY" | "SKIP" | "PREVIOUS" | "PAUSE" | "JAM" | "SHARE" | "JUMP",
   seekPosition: number
}

export const acceptNotification = async (dataRequest : acceptNotificationRequestDTO) => {
    console.log("PUT ACCEPTNOTIFICATION");
    const res = await apiClient.put(`${BASE_URL}/api/v1/jam-player-state/accept`, {
        jamId: dataRequest.jamId,
        jamNotificationId: dataRequest.jamNotificationId,
        trackId: dataRequest.trackId,
        interactionType: dataRequest.interactionType,
        seekPosition: dataRequest.seekPosition
    });
    console.log("RESPONSE ACCEPTNOTIFICATION: ", res.config.data);
    return res;
}
