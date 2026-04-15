import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { TrackContentType } from "./searchService";

export interface PlayList {
    id: number;
    title: string;
    thumbnailUrl: string;
}

export interface Person {
    id: number;
    avatarUrl: string;
    name: string;
    friendStatus: string;
}

export interface PlayListDetail {
    id: number,
    title: string,
    thumbnailUrl: string,
    description: string,
    owner: Person,
    collaborators: Person[],
    tracks: TrackContentType[],
}

export type CollaboratorPermission = 'ADD_TRACK' | 'REORDER' | 'REMOVE_TRACK';

export interface CollaboratorPermissionPayload {
    playlistId: number;
    collaboratorId: number;
    permissions: CollaboratorPermission[];
}

export interface SearchTrackRequest {
    existedTrackIds?: number[];
    keyword: string;
    pageNumber: number;
    pageSize: number;
}

export const getMemberPlayListAPI = async (id : string) : Promise<PlayList[]> => {
    console.log(`GET MEMBERPLAYLISTAPI : ${BASE_URL}/api/v1/playlist/getMemberPlaylists/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/playlist/getMemberPlaylists/${id}`);
    const playListData = res.data;
    console.log("Response GetMemnerPlayListAPI: ", playListData);
    return playListData;
}


export const createPlayListAPI = async (playListName: string) => {
    console.log(`POST CREATEPLAYLISTAPI : ${BASE_URL}/api/v1/playlist/create`);
    const res= await apiClient.post(`${BASE_URL}/api/v1/playlist/create`, {name: playListName});
    console.log("Response CreatePlayListAPI: ", res.data);
    return res.data;
}

export const getPlayListDetailAPI = async (id: number) : Promise<PlayListDetail> => {
    console.log(`GET PLAYLISTDETAILAPI : ${BASE_URL}/api/v1/playlistl/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/playlist/${id}`);
    console.log("Response GetPlayListDetailAPI: ", res.data);
    return res.data;
}

export const updatePlayListAPI = async (id: number, name: string, description: string, thumbnailKey: string, isPublic: boolean) => {
    console.log(`PUT UPDATEPLAYLISTAPI : ${BASE_URL}/api/v1/playlist/updateDetail`);
    console.log(id, name, description, thumbnailKey, isPublic);
    const res = await apiClient.put(`${BASE_URL}/api/v1/playlist/updateDetail`, {id, name, description, thumbnailKey, isPublic});
    console.log("Response UpdatePlayListAPI: ", res.data);
    return res.data;
}

export async function searchTrackToAddAPI (dataSearch: SearchTrackRequest) : Promise<TrackContentType[]>{
    console.log(`GET SEARCHTRACKTOADDAPI : ${BASE_URL}/api/v1/track/search=${dataSearch.keyword}&pageNumber=${dataSearch.pageNumber}&pageSize=${dataSearch.pageSize}`);
    console.log("Request SearchTrackToAddAPI: ", dataSearch);
    const res = await apiClient.get('/api/v1/track/search', {
        params: {
            existedTrackIds: dataSearch.existedTrackIds,
            keyword: dataSearch.keyword,
            pageNumber: dataSearch.pageNumber,
            pageSize: dataSearch.pageSize
        }
    })
    console.log("Response SearchAPI: ", res.data);
    return res.data?.content;
};

export const addTrackToPlayListAPI = async (playlistId: number[], trackId: number)  =>  {
    console.log(`POST ADDTRACKTOPLAYLISTAPI : ${BASE_URL}/api/v1/playlist-track/addTrack`);
    const res = await apiClient.post(`${BASE_URL}/api/v1/playlist-track/addTrack`, {playlistId, trackId});
    console.log("Response AddTrackToPlayListAPI: ", res.data);
    return res.data;
}

export const removeTrackFromPlayListAPI = async (playlistId: number[], trackId: number) => {
    console.log(`DELETE REMOVETRACKFROMPLAYLISTAPI : ${BASE_URL}/api/v1/playlist-track/removeTrack`);
    console.log('Request RemoveTrackFromPlayListAPI: ', {playlistId, trackId});
    const res = await apiClient.delete(`${BASE_URL}/api/v1/playlist-track/removeTrack`, { data: { playlistId, trackId } });
    console.log("Response RemoveTrackFromPlayListAPI: ", res.data);
}

export const addCollaboratorToPlayListAPI = async (playlistId: number, userIds: number[]) => {
    console.log(`POST ADDCOLLABORATORTOPLAYLISTAPI : ${BASE_URL}/api/v1/playlist-collaborator/add`);
    console.log('Request AddCollaboratorToPlayListAPI: ', {playlistId, userIds});
    const res = await apiClient.post(`${BASE_URL}/api/v1/playlist-collaborator/add`, {playlistId, userIds});
    console.log("Response AddCollaboratorToPlayListAPI: ", res.data);
    return res.data;
}

export const updateCollaboratorPermissionAPI = async (payload: CollaboratorPermissionPayload) => {
    console.log(`PUT UPDATECOLLABORATORPERMISSIONAPI : ${BASE_URL}/api/v1/playlist-collaborator/updatePermission`);
    console.log('Request UpdateCollaboratorPermissionAPI: ', payload);
    const res = await apiClient.put(`${BASE_URL}/api/v1/playlist-collaborator/updatePermission`, payload);
    console.log('Response UpdateCollaboratorPermissionAPI: ', res.data);
    return res.data;
}

export const revokeCollaboratorPermissionAPI = async (payload: CollaboratorPermissionPayload) => {
    console.log(`PUT REVOKECOLLABORATORPERMISSIONAPI : ${BASE_URL}/api/v1/playlist-collaborator/revokePermission`);
    console.log('Request RevokeCollaboratorPermissionAPI: ', payload);
    const res = await apiClient.put(`${BASE_URL}/api/v1/playlist-collaborator/revokePermission`, payload);
    console.log('Response RevokeCollaboratorPermissionAPI: ', res.data);
    return res.data;
}

export const removeCollaboratorFromPlayListAPI = async (playlistId: number, userIds: number[]) => {
    console.log(`DELETE REMOVECOLLABORATORFROMPLAYLISTAPI : ${BASE_URL}/api/v1/playlist-collaborator/delete`);
    console.log('Request RemoveCollaboratorFromPlayListAPI: ', {playlistId, userIds});
    const res = await apiClient.delete(`${BASE_URL}/api/v1/playlist-collaborator/delete`, {
        data: { playlistId, userIds }
    });
    console.log('Response RemoveCollaboratorFromPlayListAPI: ', res.data);
    return res.data;
}
