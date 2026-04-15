import apiClient from "@/api/apiClient";
import { BASE_URL } from "@/constants/baseURL";
import { TrackContentType } from "./searchService";

export interface AlbumDetail {
  id: number;
  title: string;
  thumbnailUrl: string;
  releaseYear?: number;
  artistName?: string;
  tracks: TrackContentType[];
}

export const getAlbumDetailAPI = async (
  id: number,
): Promise<TrackContentType[]> => {
  try {
    console.log(`GET ALBUMDETAILAPI : ${BASE_URL}/api/v1/album-track/${id}`);
    const res = await apiClient.get(`${BASE_URL}/api/v1/album-track/${id}`);
    console.log("Response GetAlbumDetailAPI: ", res.data);
    return res.data as TrackContentType[];
  } catch (error) {
    throw error;
    /*
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
    */
  }
};

export const addTrackToAlbumAPI = async (
  albumId: number,
  trackId: number,
  position: number,
) => {
  console.log(`POST ADDTRACKTOALBUMAPI : ${BASE_URL}/api/v1/album-track`);
  console.log("Payload: ", { albumId, trackId, position });
  const res = await apiClient.post(`${BASE_URL}/api/v1/album-track`, {
    albumId,
    trackId,
    position,
  });
  console.log("Response AddTrackToAlbumAPI: ", res.data);
  return res.data;
};

export const removeTrackFromAlbumAPI = async (
  albumId: number,
  trackId: number,
) => {
  console.log(`DELETE REMOVETRACKFROMALBUMAPI : ${BASE_URL}/api/v1/album-track/${albumId}/${trackId}`);
  const res = await apiClient.delete(
    `${BASE_URL}/api/v1/album-track/${albumId}/${trackId}`
  );
  console.log("Response RemoveTrackFromAlbumAPI: ", res.data);
  return res.data;
};
