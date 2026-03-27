import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

export interface PlayList {
    id: number;
    title: string;
    thumbnailURL: string;
}

export const getMemberPlayListAPI = async (id : string) : Promise<PlayList> => {
    console.log(`GET MEMBERPLAYLISTAPI : ${BASE_URL}/api/v1/playlist/getMemberPlaylists/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/playlist/getMemberPlaylists/${id}`);
    const playListData = res.data as PlayList;
    console.log("Response GetMemnerPlayListAPI: ", playListData);
    return playListData;
}