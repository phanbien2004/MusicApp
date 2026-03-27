//   const router = useRouter();
//       const [query, setQuery] = useState('');
//       const [isFocused, setIsFocused] = useState(false);
//       const [activeCategory, setActiveCategory] = useState<Category>('Songs');
//       const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
//       const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  
//       const { setCurrentSong } = useCurrentSong()!;
  
//       const handleSelectSong = (item: SearchResult) => {
//           // Chỉ xử lý nếu type là 'Songs'
//           if (item.type === 'Songs') {
//               const songData: Song = {
//                   id: item.id,
//                   title: item.title,
//                   artist: item.subtitle,
//                   url: '', // Sau này map với URL từ API
//                   duration: item.duration,
//               };
//               setCurrentSong(songData); // Cập nhật bài hát vào context toàn cục
//           }
//       };
  
//       const toggleFollow = (id: string) => {
//           setFollowedIds(prev => {
//               const next = new Set(prev);
//               next.has(id) ? next.delete(id) : next.add(id);
//               return next;
//           });
//       };
  
//       const toggleAdd = (id: string) => {
//           setAddedIds(prev => {
//               const next = new Set(prev);
//               next.has(id) ? next.delete(id) : next.add(id);
//               return next;
//           });
//       };
  
//       const filtered = allResults.filter((item) => {
//           const matchCategory = activeCategory === 'All' || item.type === activeCategory;
//           const matchQuery = query.trim() === '' ||
//               item.title.toLowerCase().includes(query.toLowerCase()) ||
//               item.subtitle.toLowerCase().includes(query.toLowerCase());
//           return matchCategory && matchQuery;
//       });      
        
        
        
        
        
//         <SafeAreaView style={styles.safeArea}>
//             <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

//             {/* ─── HEADER ─── */}
//             <View style={styles.header}>
//                 <Text style={styles.logo}>AABT</Text>
//                 <View style={styles.headerIcons}>
//                     <TouchableOpacity
//                         style={styles.iconBtn}
//                         onPress={() => router.push('/(tabs)/notifications')}>
//                         <Ionicons name="notifications-outline" size={24} color={Colors.white} />
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             {/* ─── SEARCH BAR ─── */}
//             <View style={styles.searchWrapper}>
//                 <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
//                     <Ionicons
//                         name="search"
//                         size={20}
//                         color={isFocused ? Colors.teal : Colors.gray}
//                     />
//                     <TextInput
//                         style={styles.input}
//                         placeholder="Search songs, artists, friends..."
//                         placeholderTextColor={Colors.gray}
//                         value={query}
//                         onChangeText={setQuery}
//                         onFocus={() => setIsFocused(true)}
//                         onBlur={() => setIsFocused(false)}
//                         returnKeyType="search"
//                     />
//                     {query.length > 0 && (
//                         <TouchableOpacity onPress={() => setQuery('')}>
//                             <Ionicons name="close-circle" size={18} color={Colors.gray} />
//                         </TouchableOpacity>
//                     )}
//                 </View>
//             </View>

//             {/* ─── CATEGORY TABS ─── */}
//             <View style={styles.categoryRow}>
//                 {CATEGORIES.map((cat) => (
//                     <TouchableOpacity
//                         key={cat}
//                         style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
//                         onPress={() => setActiveCategory(cat)}>
//                         <Text style={[
//                             styles.categoryText,
//                             activeCategory === cat && styles.categoryTextActive,
//                         ]}>
//                             {cat}
//                         </Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>

//             {/* ─── RESULTS ─── */}
//             <FlatList
//                 data={filtered}
//                 keyExtractor={(item) => item.id}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.listContent}
//                 ItemSeparatorComponent={() => <View style={styles.separator} />}
//                 ListEmptyComponent={
//                     <View style={styles.emptyState}>
//                         <Ionicons name="search-outline" size={52} color={Colors.gray} />
//                         <Text style={styles.emptyText}>No results found</Text>
//                         <Text style={styles.emptySubText}>Try a different keyword</Text>
//                     </View>
//                 }
//                 renderItem={({ item }) => (
//                     <TouchableOpacity 
//                         style={styles.resultItem}
//                         onPress={() => handleSelectSong(item)}
//                     >
//                         {/* Thumbnail */}
//                         <View style={[
//                             styles.thumbnail,
//                             (item.type === 'Artists' || item.type === 'Users') && styles.thumbnailRound,
//                         ]}>
//                             <Ionicons
//                                 name={
//                                     item.type === 'Artists' ? 'person' :
//                                         item.type === 'Users' ? 'person' :
//                                             item.type === 'Albums' ? 'disc' : 'musical-notes'
//                                 }
//                                 size={20}
//                                 color="#555"
//                             />
//                         </View>

//                         {/* Info */}
//                         <View style={styles.resultInfo}>
//                             <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
//                             <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
//                         </View>

//                         {/* Right action: Follow / Add / Duration / Menu */}
//                         {item.type === 'Artists' ? (
//                             <TouchableOpacity
//                                 style={[
//                                     styles.actionBtn,
//                                     followedIds.has(item.id) && styles.actionBtnActive,
//                                 ]}
//                                 onPress={() => toggleFollow(item.id)}>
//                                 <Text style={[
//                                     styles.actionBtnText,
//                                     followedIds.has(item.id) && styles.actionBtnTextActive,
//                                 ]}>
//                                     {followedIds.has(item.id) ? 'Following' : 'Follow'}
//                                 </Text>
//                             </TouchableOpacity>
//                         ) : item.type === 'Users' ? (
//                             <TouchableOpacity
//                                 style={[
//                                     styles.actionBtn,
//                                     addedIds.has(item.id) && styles.actionBtnActive,
//                                 ]}
//                                 onPress={() => toggleAdd(item.id)}>
//                                 <Text style={[
//                                     styles.actionBtnText,
//                                     addedIds.has(item.id) && styles.actionBtnTextActive,
//                                 ]}>
//                                     {addedIds.has(item.id) ? 'Added' : 'Add'}
//                                 </Text>
//                             </TouchableOpacity>
//                         ) : item.duration ? (
//                             <Text style={styles.duration}>{item.duration}</Text>
//                         ) : (
//                             <TouchableOpacity>
//                                 <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray} />
//                             </TouchableOpacity>
//                         )}
//                     </TouchableOpacity>
//                 )}
//             />
//         </SafeAreaView>