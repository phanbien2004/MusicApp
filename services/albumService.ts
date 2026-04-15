import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { Person } from "./listService";
import { TrackContentType } from "./searchService";

export interface AlbumDetail {
  id: number;
  title: string;
  thumbnailUrl: string;
  releaseYear?: number;
  artist?: Person; // In mock we use artist, in backend might be owner/artist
  tracks: TrackContentType[];
}

export const getAlbumDetailAPI = async (id: number): Promise<AlbumDetail> => {
  try {
    console.log(`GET ALBUMDETAILAPI : ${BASE_URL}/api/v1/album/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/album/${id}`);
    return res.data;
  } catch (error) {
    console.log(`Mocking album data for id: ${id}`);
    // Return mock data for UI to work based on the provided screenshot
    return {
      id: id,
      title: "Đây là tên của Album",
      thumbnailUrl: "https://via.placeholder.com/300/CCCCCC/AAAAAA",
      artist: {
        id: 1,
        name: "Sơn Tùng - MTP",
        avatarUrl: "",
        friendStatus: "NONE",
      },
      tracks: [
        {
          id: 101,
          title: "Tên của bài hát 1",
          thumbnailUrl: "https://via.placeholder.com/150/CCCCCC/AAAAAA",
          duration: 200,
          contributors: [{ id: 1, name: "Tên ca sĩ" }],
        },
        {
          id: 102,
          title: "Tên của bài hát 2",
          thumbnailUrl: "https://via.placeholder.com/150/CCCCCC/AAAAAA",
          duration: 210,
          contributors: [{ id: 1, name: "Tên ca sĩ" }],
        },
        {
          id: 103,
          title: "Tên của bài hát 3",
          thumbnailUrl: "https://via.placeholder.com/150/CCCCCC/AAAAAA",
          duration: 190,
          contributors: [{ id: 1, name: "Tên ca sĩ" }],
        },
        {
          id: 104,
          title: "Tên của bài hát 4",
          thumbnailUrl: "https://via.placeholder.com/150/CCCCCC/AAAAAA",
          duration: 230,
          contributors: [{ id: 1, name: "Tên ca sĩ" }],
        },
      ],
    };
  }
};
