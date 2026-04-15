// import apiClient from "@/api/apiClient";
// import { BASE_URL } from "@/constants/baseURL";
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';

import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { CurrentTrack } from "@/context/currentTrack-context";
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

export const inviteJamSessionAPI = async (jamSessionId: number, memberIds: number[]) => {
    console.log("Payload InviteJamSessionAPI: ", { jamSessionId, memberIds });
    console.log(`POST INVITEJAMSESSIONAPI : ${BASE_URL}/api/v1/jam/invite`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/jam/invite`, {
        jamSessionId,
        memberIds
    });
    console.log("Response InviteJamSessionAPI: ", res.data);
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

export interface JamTrackDTO extends CurrentTrack {
    currentSeekPosition: number,
    playing: boolean
}

export interface ResponseJamDTO  {
    id: number,
    code: string,
    size: 0,
    members : [
        {
            id: number,
            avatarUrl: string,
            name: string,
            friendStatus: string
        }
    ],
    owner: {
        id : number,
        avatarUrl : string,
        name: string,
        friendStatus: string
    },
    jamTrack: JamTrackDTO
}
export const getJam = async (id: number) : Promise <ResponseJamDTO> => {
    console.log("GET JAM", id);
    const res = await apiClient.get(`/api/v1/jam/${id}`);
    console.log("RESPONSE GET JAM: ", res.data);
    return res.data as ResponseJamDTO;
}

export const setJamContext = async (jamId: number, trackId: number, playlistId: number | null, albumId: number | null) => {
    console.log("PUT CONTEXT");
    console.log(jamId,trackId,playlistId,albumId );
    const res = await apiClient.put("/api/v1/jam/context", {
        jamId, trackId, playlistId, albumId
    });
    console.log("RESPONSE SETJAMCONTEXT: ", res.data);
    return res.data
}