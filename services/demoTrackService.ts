import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";


export const getDemoTrackAPI = async () : Promise<string[]>=> {
    console.log(`GET DemoTrackAPI: ${BASE_URL}/api/v1/demo/getTracks` );
    const res = await apiClient.get(`${BASE_URL}/api/v1/demo/getTracks`);
    const dataTracks = res.data as string[];
    console.log("Response Get DemoTrackAPI: ", dataTracks);
    return dataTracks;
}