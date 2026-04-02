// import { Colors } from '@/constants/theme';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React, { useRef } from 'react';
// import {
//     Animated,
//     StatusBar,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// // Import đúng Context của bạn
// import { Song, useCurrentSong } from '@/context/currentTrack-context';

// export default function PlaylistDetailScreen() {
//     const router = useRouter();
//     const insets = useSafeAreaInsets();
    
//     // 1. Lấy dữ liệu và hàm điều khiển từ Context
//     const songContext = useCurrentSong();
//     // Lấy currentSong để xác định bài nào đang phát
//     const currentSongId = songContext?.currentSong?.id;
//     const setCurrentSong = songContext?.setCurrentSong;

//     const SONGS: Song[] = [
//         { id: '1', title: 'Em của ngày hôm qua', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//         { id: '2', title: 'Nơi này có anh', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//         { id: '3', title: 'Chạy ngay đi', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//         { id: '4', title: 'Lạc trôi', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//         { id: '5', title: 'Muộn rồi mà sao còn', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//         { id: '6', title: 'Hãy trao cho anh', artist: 'Sơn Tùng MTP', url: '', artwork: '', duration: '' },
//     ];

//     // 2. Hàm xử lý khi nhấn vào bài hát
//     const handleSelectSong = (item: Song) => {
//         if (setCurrentSong) {
//             setCurrentSong(item); // Đẩy dữ liệu lên Context toàn cục
//         }
//     };
    
//     const scrollY = useRef(new Animated.Value(0)).current;

//     const headerTitleOpacity = scrollY.interpolate({
//         inputRange: [140, 200],
//         outputRange: [0, 1],
//         extrapolate: 'clamp',
//     });

//     const headerBgOpacity = scrollY.interpolate({
//         inputRange: [100, 180],
//         outputRange: [0, 1],
//         extrapolate: 'clamp',
//     });

//     // 3. Render từng item bài hát
//     const renderSongItem = ({ item }: { item : Song }) => {
//         // So sánh ID để biết bài nào đang phát
//         const isCurrent = currentSongId === item.id;

//         return (
//             <TouchableOpacity 
//                 style={styles.songItem} 
//                 activeOpacity={0.7}
//                 onPress={() => handleSelectSong(item)}
//             >
//                 <View style={styles.songThumbnail}>
//                     <Ionicons 
//                         name={isCurrent ? "volume-high" : "musical-note"} 
//                         size={20} 
//                         color={isCurrent ? Colors.teal : "#555"} 
//                     />
//                 </View>
//                 <View style={styles.songInfo}>
//                     <Text 
//                         style={[styles.songTitle, isCurrent && { color: Colors.teal }]} 
//                         numberOfLines={1}
//                     >
//                         {item.title}
//                     </Text>
//                     <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
//                 </View>
//                 <TouchableOpacity style={{ padding: 10 }}>
//                     <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray} />
//                 </TouchableOpacity>
//             </TouchableOpacity>
//         );
//     };

//     return (
//         <View style={styles.container}>
//             <StatusBar barStyle="light-content" />

//             {/* --- FIXED HEADER BACKGROUND --- */}
//             <Animated.View 
//                 style={[
//                     styles.headerBg, 
//                     { 
//                         height: insets.top + 60,
//                         backgroundColor: '#000', 
//                         opacity: headerBgOpacity 
//                     }
//                 ]} 
//             />
            
//             <View style={[styles.headerContent, { paddingTop: insets.top }]}>
//                 <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//                     <Ionicons name="chevron-back" size={28} color={Colors.white} />
//                 </TouchableOpacity>

//                 <Animated.View style={[styles.headerTitleCenter, { opacity: headerTitleOpacity }]}>
//                     <Text style={styles.headerTitleText}>List 01</Text>
//                 </Animated.View>

//                 <View style={{ width: 40 }} />
//             </View>

//             <Animated.FlatList
//                 data={SONGS}
//                 keyExtractor={(item) => item.id}
//                 renderItem={renderSongItem}
//                 onScroll={Animated.event(
//                     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//                     { useNativeDriver: true }
//                 )}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
//                 ListHeaderComponent={
//                     <View style={styles.topSection}>
//                         <View style={styles.mainCover}>
//                              <Ionicons name="disc-outline" size={80} color="#333" />
//                         </View>

//                         <View style={styles.titleRow}>
//                             <Text style={styles.playlistTitleLarge}>List 01</Text>
//                             <TouchableOpacity style={styles.editIconBtn}>
//                                 <Ionicons name="pencil-sharp" size={18} color={Colors.white} />
//                             </TouchableOpacity>
//                         </View>

//                         <View style={styles.creatorRow}>
//                             <View style={styles.avatarStack}>
//                                 <View style={[styles.miniAvatar, { backgroundColor: Colors.teal, zIndex: 2 }]} />
//                                 <View style={[styles.miniAvatar, { backgroundColor: '#ff6b6b', marginLeft: -12, zIndex: 1 }]} />
//                             </View>
//                             <Text style={styles.creatorNameText}>Bien</Text>
//                         </View>

//                         <View style={styles.buttonActionRow}>
//                             <View style={styles.leftButtonGroup}>
//                                 <TouchableOpacity style={styles.actionBtnSmall}>
//                                     <Text style={styles.actionBtnText}>+ ADD</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity style={styles.actionBtnSmall}>
//                                     <Ionicons name="options-outline" size={14} color={Colors.white} />
//                                     <Text style={[styles.actionBtnText, {marginLeft: 4}]}>EDIT</Text>
//                                 </TouchableOpacity>
//                             </View>

//                             <View style={styles.rightButtonGroup}>
//                                 <TouchableOpacity style={styles.shuffleIconButton}>
//                                     <Ionicons name="shuffle" size={26} color={Colors.white} />
//                                 </TouchableOpacity>
//                                 <TouchableOpacity 
//                                     style={styles.mainPlayButton}
//                                     onPress={() => handleSelectSong(SONGS[0])}
//                                 >
//                                     <Ionicons name="play" size={30} color="#000" />
//                                 </TouchableOpacity>
//                             </View>
//                         </View>
//                     </View>
//                 }
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#000' },
//     headerBg: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
//     headerContent: {
//         position: 'absolute', top: 0, left: 0, right: 0,
//         flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 100, zIndex: 11,
//     },
//     backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
//     headerTitleCenter: { flex: 1, alignItems: 'center' },
//     headerTitleText: { color: '#fff', fontSize: 17, fontWeight: '700' },
//     scrollContent: { paddingHorizontal: 20, paddingTop: 40 },
//     topSection: { alignItems: 'flex-start', marginTop: 60, marginBottom: 20 },
//     mainCover: {
//         width: 200, height: 200, backgroundColor: '#111', borderRadius: 30,
//         alignSelf: 'center', marginBottom: 25, justifyContent: 'center', alignItems: 'center',
//         borderWidth: 1, borderColor: '#222',
//     },
//     titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
//     playlistTitleLarge: { fontSize: 32, fontWeight: '900', color: '#fff', marginRight: 12 },
//     editIconBtn: { padding: 4 },
//     creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
//     avatarStack: { flexDirection: 'row', marginRight: 10 },
//     miniAvatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#000' },
//     creatorNameText: { color: '#fff', fontSize: 16, fontWeight: '700' },
//     buttonActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
//     leftButtonGroup: { flexDirection: 'row', gap: 10 },
//     rightButtonGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
//     actionBtnSmall: {
//         backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8,
//         borderRadius: 10, flexDirection: 'row', alignItems: 'center',
//     },
//     actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
//     shuffleIconButton: { padding: 4 },
//     mainPlayButton: {
//         width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.teal,
//         justifyContent: 'center', alignItems: 'center',
//     },
//     songItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
//     songThumbnail: {
//         width: 52, height: 52, backgroundColor: '#111', borderRadius: 8,
//         marginRight: 16, justifyContent: 'center', alignItems: 'center',
//     },
//     songInfo: { flex: 1 },
//     songTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
//     songArtist: { color: Colors.gray, fontSize: 14 },
// });