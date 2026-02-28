import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Modal,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, LogOut, ArrowLeft, Users, MoreVertical, Trash2, X } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { Container } from '../components/Container';
import { theme } from '../theme';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Message } from '../types';

const SOCKET_URL = 'http://192.168.1.47:3000/chat';

function formatMessageDate(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `Hôm qua ${format(d, 'HH:mm')}`;
    return format(d, 'dd/MM HH:mm');
}

function getAvatarColor(username: string) {
    const colors = ['#2563FF', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export const ChatRoomScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const { groupId, groupName } = route.params;

    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    const currentUser = useAuthStore(state => state.user);
    const accessToken = useAuthStore(state => state.accessToken);

    // realtime messages từ socket (tách riêng khỏi cache)
    const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);

    // Lấy lịch sử tin nhắn với CACHE: staleTime 5 phút, gcTime 10 phút
    // vào lại màn hình sẽ hiện các tin từ cache ngay lập tức không loading
    const {
        data: historyMessages = [],
        isLoading: isLoadingHistory,
        isFetching,
    } = useQuery({
        queryKey: ['messages', groupId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/groups/${groupId}/messages`);
            const payload: any = data;
            const msgs = payload.data?.data || payload.data || [];
            // Backend đã reverse: trả về cũ → mới (ascending)
            return Array.isArray(msgs) ? msgs as Message[] : [];
        },
        staleTime: 5 * 60 * 1000,   // 5 phút: không gọi API lại khi vào lại sớm
        gcTime: 10 * 60 * 1000,     // 10 phút: giữ cache trong bộ nhớ
    });

    // Merge: history (cache) + realtime (socket), deduplicate theo id
    const messages = React.useMemo(() => {
        const historyIds = new Set(historyMessages.map((m: Message) => m.id));
        const newOnes = realtimeMessages.filter(m => !historyIds.has(m.id));
        return [...historyMessages, ...newOnes];
    }, [historyMessages, realtimeMessages]);

    // Scroll xuống cuối khi history load lần đầu
    useEffect(() => {
        if (!isLoadingHistory && historyMessages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        }
    }, [isLoadingHistory]);


    // Lấy thông tin group (số thành viên)
    const { data: groupDetail } = useQuery({
        queryKey: ['group-detail', groupId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/groups/${groupId}`);
            const payload: any = data;
            return payload.data || payload;
        },
    });

    const memberCount = groupDetail?.members?.length ?? groupDetail?._count?.members ?? 0;

    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: string) => {
            await apiClient.delete(`/messages/${messageId}`);
            return messageId;
        },
        onSuccess: (messageId) => {
            // Xóa ở cả cache lẫn realtime
            queryClient.setQueryData<Message[]>(['messages', groupId], (old) =>
                old ? old.filter(m => m.id !== messageId) : []
            );
            setRealtimeMessages(prev => prev.filter(m => m.id !== messageId));
            setShowDeleteModal(null);
        },
    });

    const leaveGroupMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/groups/${groupId}/leave`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_groups'] });
            setShowLeaveModal(false);
            navigation.goBack();
        },
    });

    // Socket setup
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            auth: { token: `Bearer ${accessToken}` },
            transports: ['websocket'],
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('joinRoom', { groupId });
        });

        newSocket.on('newMessage', (msg: Message) => {
            // Chỉ append vào realtime list, không đụng vào cache
            setRealtimeMessages(prev => [...prev, msg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
        });

        newSocket.on('userTyping', ({ userId, username, isTyping }: any) => {
            if (userId === currentUser?.id) return;
            setTypingUsers(prev => {
                const next = { ...prev };
                if (isTyping) { next[userId] = username; } else { delete next[userId]; }
                return next;
            });
        });

        return () => {
            newSocket.emit('leaveRoom', { groupId });
            newSocket.disconnect();
        };
    }, [groupId, accessToken]);

    // Typing indicator
    useEffect(() => {
        if (!socket) return;
        if (inputText.trim().length > 0) {
            socket.emit('typing', { groupId, isTyping: true });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing', { groupId, isTyping: false });
            }, 3000);
        } else {
            socket.emit('typing', { groupId, isTyping: false });
        }
    }, [inputText, socket, groupId]);

    const handleSend = () => {
        if (!inputText.trim() || !socket) return;
        socket.emit('sendMessage', { groupId, content: inputText.trim() });
        socket.emit('typing', { groupId, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setInputText('');
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isMine = item.sender?.id === currentUser?.id;
        const isFirstInGroup = index === messages.length - 1 ||
            messages[index + 1]?.sender?.id !== item.sender?.id;
        const avatarColor = getAvatarColor(item.sender?.username || '?');

        return (
            <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
                {/* Avatar cho người khác */}
                {!isMine && (
                    <View style={[styles.avatar, { backgroundColor: avatarColor, opacity: isFirstInGroup ? 1 : 0 }]}>
                        {item.sender?.avatarUrl ? (
                            <Image source={{ uri: item.sender.avatarUrl }} style={styles.avatarImg} contentFit="cover" />
                        ) : (
                            <Text style={styles.avatarLetter}>{item.sender?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
                        )}
                    </View>
                )}

                <View style={[styles.bubbleWrapper, isMine ? styles.bubbleWrapperMine : styles.bubbleWrapperOther]}>
                    {/* Tên người gửi (chỉ hiện dòng đầu nhóm) */}
                    {!isMine && isFirstInGroup && (
                        <Text style={[styles.senderName, { color: avatarColor }]}>{item.sender?.username}</Text>
                    )}

                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
                        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                            {formatMessageDate(item.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* Nút xóa cho tin nhắn của mình */}
                {isMine && (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setShowDeleteModal(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Trash2 size={13} color="rgba(255,255,255,0.25)" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const typingNames = Object.values(typingUsers);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10, paddingBottom: 10 }]}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ArrowLeft size={22} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{groupName || 'Phòng Chat'}</Text>
                    {memberCount > 0 && (
                        <View style={styles.headerMeta}>
                            <View style={styles.onlineDot} />
                            <Users size={11} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.headerMetaText}>{memberCount} thành viên</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setShowLeaveModal(true)} activeOpacity={0.7}>
                    <LogOut size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Message List */}
                {isLoadingHistory && messages.length === 0 ? (
                    // Spinner chỉ hiện khi chưa có cache nào
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
                    </View>
                ) : !isLoadingHistory && messages.length === 0 ? (
                    // Empty chỉ hiện khi đã load xong và thực sự không có tin
                    <View style={styles.center}>
                        <View style={styles.emptyIcon}>
                            <Users size={32} color="rgba(255,255,255,0.2)" />
                        </View>
                        <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
                        <Text style={styles.emptySubtitle}>Hãy là người đầu tiên gửi tin nhắn! 👋</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {/* Typing Indicator */}
                {typingNames.length > 0 && (
                    <View style={styles.typingContainer}>
                        <View style={styles.typingDots}>
                            <View style={styles.typingDot} />
                            <View style={styles.typingDot} />
                            <View style={styles.typingDot} />
                        </View>
                        <Text style={styles.typingText}>
                            {typingNames.slice(0, 2).join(', ')}
                            {typingNames.length > 2 ? ` +${typingNames.length - 2}` : ''} đang nhập...
                        </Text>
                    </View>
                )}

                {/* Input Bar */}
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Nhắn tin..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={2000}
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        activeOpacity={0.8}
                    >
                        <Send size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Modal Rời nhóm */}
            <Modal visible={showLeaveModal} transparent animationType="fade" onRequestClose={() => setShowLeaveModal(false)} statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.alertBox}>
                        <View style={[styles.alertIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <LogOut size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Rời nhóm</Text>
                        <Text style={styles.alertMessage}>Bạn có chắc muốn rời khỏi nhóm "{groupName}"?</Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity style={[styles.alertBtn, styles.alertBtnCancel]} onPress={() => setShowLeaveModal(false)} activeOpacity={0.8}>
                                <Text style={styles.alertBtnCancelText}>Hủy bỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertBtn, styles.alertBtnDanger]}
                                onPress={() => leaveGroupMutation.mutate()}
                                disabled={leaveGroupMutation.isPending}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.alertBtnDangerText}>{leaveGroupMutation.isPending ? 'Đang rời...' : 'Rời nhóm'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Xóa tin nhắn */}
            <Modal visible={!!showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(null)} statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.alertBox}>
                        <View style={[styles.alertIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Trash2 size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Xóa tin nhắn</Text>
                        <Text style={styles.alertMessage}>Tin nhắn này sẽ bị xóa vĩnh viễn.</Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity style={[styles.alertBtn, styles.alertBtnCancel]} onPress={() => setShowDeleteModal(null)} activeOpacity={0.8}>
                                <Text style={styles.alertBtnCancelText}>Hủy bỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertBtn, styles.alertBtnDanger]}
                                onPress={() => showDeleteModal && deleteMessageMutation.mutate(showDeleteModal)}
                                disabled={deleteMessageMutation.isPending}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.alertBtnDangerText}>{deleteMessageMutation.isPending ? 'Đang xóa...' : 'Xóa'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A1628',
    },
    flex: {
        flex: 1,
    },

    // ─── Header ───────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#0F1E35',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.07)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.3,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E',
        marginRight: 2,
    },
    headerMetaText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '500',
    },
    headerMenuBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239,68,68,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },

    // ─── List ──────────────────────────────────────────────
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 20,
    },

    // ─── Message Row ───────────────────────────────────────
    msgRow: {
        flexDirection: 'row',
        marginBottom: 4,
        alignItems: 'flex-end',
    },
    msgRowMine: {
        justifyContent: 'flex-end',
    },
    msgRowOther: {
        justifyContent: 'flex-start',
    },

    // ─── Avatar ────────────────────────────────────────────
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        flexShrink: 0,
    },
    avatarImg: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },

    // ─── Bubble ────────────────────────────────────────────
    bubbleWrapper: {
        maxWidth: '78%',
    },
    bubbleWrapperMine: {
        alignItems: 'flex-end',
    },
    bubbleWrapperOther: {
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 3,
        marginLeft: 2,
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    bubbleMine: {
        backgroundColor: '#2563FF',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    bubbleText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 21,
    },
    bubbleTextMine: {
        color: '#FFF',
    },
    bubbleTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    bubbleTimeMine: {
        color: 'rgba(255,255,255,0.55)',
    },

    // ─── Delete ────────────────────────────────────────────
    deleteBtn: {
        marginLeft: 6,
        marginBottom: 4,
        padding: 4,
    },

    // ─── Typing ────────────────────────────────────────────
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 6,
        gap: 8,
    },
    typingDots: {
        flexDirection: 'row',
        gap: 3,
    },
    typingDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    typingText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
    },

    // ─── Input Bar ─────────────────────────────────────────
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#0F1E35',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
    },
    input: {
        color: '#FFF',
        fontSize: 15,
        maxHeight: 100,
        lineHeight: 20,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        shadowOpacity: 0,
        elevation: 0,
    },

    // ─── Modals ────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        backgroundColor: '#0F172A',
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    alertIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBtnCancel: {
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    alertBtnCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    alertBtnDanger: {
        backgroundColor: '#EF4444',
    },
    alertBtnDangerText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});
