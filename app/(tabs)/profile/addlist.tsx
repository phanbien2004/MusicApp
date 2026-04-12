import { Colors } from "@/constants/theme";
import { createPlayListAPI } from "@/services/listService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Thêm router để nút X có tác dụng
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const handleTouchCreatePlaylist = async (playlistName: string) => {
    const res = await createPlayListAPI(playlistName);
}

export default function AddListScreen() {
    const router = useRouter();
    const [playlistName, setPlaylistName] = React.useState("");

    const handleTouchCreate = async () => {
        const res = await createPlayListAPI(playlistName);
        if(res) {
            router.back();
        }
    }

    return (
        <View style={styles.container}>
            {/* Đưa icon vào TouchableOpacity để có thể bấm được */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()} // Quay lại màn hình trước
            >
                <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.text}>New Playlist</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter playlist name"
                placeholderTextColor="#888"
                value={playlistName}
                autoFocus={true} // Tự động hiện bàn phím khi vào màn hình
                onChangeText={(text) => setPlaylistName(text)}
            />

            <TouchableOpacity style={styles.createBtn} onPress={handleTouchCreate}>
                <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        paddingHorizontal: 20,
    },
    // Style cho nút đóng
    closeButton: {
        position: "absolute",
        top: 50,    // Khoảng cách từ đỉnh màn hình xuống (tùy chỉnh cho phù hợp tai thỏ)
        right: 20,  // Khoảng cách từ lề phải vào
        padding: 10, // Tăng vùng bấm cho người dùng
        zIndex: 10,  // Đảm bảo nút luôn nằm trên cùng
    },
    text: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
    },
    input: {
        marginTop: 20,
        width: "80%",
        textAlign: "center",
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        borderBottomWidth: 2,
        borderBottomColor: Colors.white,
        paddingBottom: 10,
    },
    createBtn: {
        marginTop: 40,
        backgroundColor: Colors.teal, // Sử dụng màu teal cho đồng bộ app nhạc
        paddingHorizontal: 50,
        paddingVertical: 14,
        borderRadius: 25, // Bo tròn hơn cho hiện đại
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
    },
});
