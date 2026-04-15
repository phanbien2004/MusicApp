import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JamNotificationSheetProps {
    isHost: boolean;
    activityItems: any[];
    onApprove: (item: any) => void;
}

export default function JamNotificationSheet({ 
    isHost, 
    activityItems, 
    onApprove
}: JamNotificationSheetProps) {

    // Hàm format tin nhắn từ số giây sang mm:ss (Đã khôi phục)
    // const formatMessageWithTime = (originalMessage: any) => {
    //     if (!originalMessage || typeof originalMessage !== 'string') {
    //         return "";
    //     }
    //     const match = originalMessage.match(/\d+/);
        
    //     if (match) {
    //         const seconds = parseInt(match[0], 10);
    //         const mins = Math.floor(seconds / 60);
    //         const secs = seconds % 60;
    //         const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    //         return originalMessage.replace(match[0], timeFormatted);
    //     }
    //     return originalMessage;
    // };

    // Hàm tính thời gian tương đối (Đã khôi phục)
    const getRelativeTime = (timeArray: any) => {
        if (!Array.isArray(timeArray) || timeArray.length < 5) return 'vừa xong';

        try {
            const pastDate = new Date(
                timeArray[0],
                timeArray[1] - 1,
                timeArray[2],
                timeArray[3],
                timeArray[4],
                timeArray[5] || 0
            );
            
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

            if (diffInSeconds < 60) return 'vừa xong';
            
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours} giờ trước`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays} ngày trước`;

            return `${timeArray[2]}/${timeArray[1]}/${timeArray[0]}`;
        } catch (error) {
            return 'vừa xong';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sheetTitle}>Jam Activity</Text>
            
            <FlatList
                data={activityItems}
                keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.notifItem}>
                        <View style={styles.notifAvatar}>
                            <Ionicons name="person" size={20} color="#666" />
                        </View>

                        <View style={styles.notifContent}>
                            <Text style={styles.notifBody}>{item.message}</Text>
                            <Text style={styles.notifTime}>
                                • {item.createdAt ? getRelativeTime(item.createdAt) : 'vừa xong'}
                            </Text>
                        </View>

                        {isHost && !['JOINED', 'MEMBER_JOINED', 'JOIN_JAM'].includes(item.notificationType) && !item.message?.toLowerCase().includes('joined') && (
                            <View style={styles.actionButtons}>
                                {item.status === 'ACCEPTED' ? (
                                    <Text style={[styles.notifTime, { color: Colors.teal, fontWeight: 'bold' }]}>Accepted</Text>
                                ) : (
                                    <>
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            onPress={() => onApprove(item)}
                                        >
                                            <Ionicons name="checkmark-circle" size={26} color={Colors.teal} />
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="close-circle" size={26} color={Colors.gray} />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.helperText}>No activity yet.</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    sheetTitle: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: '#FFF', 
        textAlign: 'center', 
        marginBottom: 16 
    },
    notifItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        borderBottomWidth: 0.5,
        borderBottomColor: '#222'
    },
    notifAvatar: { 
        width: 42, 
        height: 42, 
        borderRadius: 21, 
        backgroundColor: '#2A2A2A',
        alignItems: 'center',
        justifyContent: 'center'
    },
    notifContent: { flex: 1, marginLeft: 12 },
    notifBody: { color: '#FFF', fontSize: 14, lineHeight: 18 },
    notifTime: { color: '#888', fontSize: 11, marginTop: 4 },
    actionButtons: { flexDirection: 'row', gap: 12, marginLeft: 8 },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    helperText: { color: Colors.gray, fontSize: 14 }
});