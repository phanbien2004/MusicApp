import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { NotificationDTO } from "@/context/notification-context";

export const getOldNotificationsAPI = async (userId: string | number): Promise<NotificationDTO[]> => {
    try {
        console.log(`GET Historical Notifications: ${BASE_URL}/api/v1/notification/user/${userId}`);
        const res = await apiClient.get(`${BASE_URL}/api/v1/notification/user/${userId}`);
        console.log("Response Historical Notifications:", res.data);
        return res.data;
    } catch (error) {
        console.error("Failed to fetch historical notifications:", error);
        return [];
    }
};
