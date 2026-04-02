import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";

export const addFriendAPI = async (friendId : string) => {
    console.log(`POST AddFriendAPI: ${BASE_URL}/api/v1/friendship/addFriend/${friendId}`);
    const response = await apiClient.post(`/api/v1/friendship/addFriend/${friendId}`);
    console.log("Response AddFriendAPI: ", response.data);
    return response.data;
}

export const acceptFriendAPI = async (friendId : string) => {
    console.log(`PUT AcceptFriendAPI: ${BASE_URL}/api/v1/friendship/acceptFriend/${friendId}`);
    const response = await apiClient.put(`/api/v1/friendship/acceptFriend/${friendId}`);
    console.log("Response AcceptFriendAPI: ", response.data);
    return response.data; 
}

export const deleteFriendAPI = async (friendId : string) => {
    console.log(`DELETE DeleteFriendAPI: ${BASE_URL}/api/v1/friendship/deleteFriend/${friendId}`);
    const response = await apiClient.delete(`/api/v1/friendship/deleteFriend/${friendId}`);
    console.log("Response DeleteFriendAPI: ", response.data);
    return response.data;
}

export const deleteFriendRequestAPI = async (friendId : string) => {
    console.log(`DELETE DeleteFriendRequestAPI: ${BASE_URL}/api/v1/friendship/deleteFriendRequest/${friendId}`);
    const response = await apiClient.delete(`/api/v1/friendship/deleteFriendRequest/${friendId}`);
    console.log("Response DeleteFriendRequestAPI: ", response.data);
    return response.data;
}