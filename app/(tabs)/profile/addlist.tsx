import { Colors } from "@/constants/theme";
import { createPlayListAPI } from "@/services/listService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; 
import { usePlayer } from "@/context/player-context";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AddListScreen() {
    const router = useRouter();
    const { lastActiveTab } = usePlayer();
    const [playlistName, setPlaylistName] = React.useState("");

    const handleClose = () => {
        const tab = lastActiveTab || 'home';
        router.navigate(`/(tabs)/${tab}` as any);
    }

    const handleTouchCreate = async () => {
        if (!playlistName.trim()) return;
        const res = await createPlayListAPI(playlistName);
        if(res) {
            handleClose();
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose} 
            >
                <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.text}>New Playlist</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter playlist name"
                placeholderTextColor="#888"
                value={playlistName}
                autoFocus={true} 
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
    closeButton: {
        position: "absolute",
        top: 50,    
        right: 20,  
        padding: 10,
        zIndex: 10, 
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
        backgroundColor: Colors.teal, 
        paddingHorizontal: 50,
        paddingVertical: 14,
        borderRadius: 25, 
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
    },
});
