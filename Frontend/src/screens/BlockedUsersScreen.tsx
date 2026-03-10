import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';

import { Container } from '../components/Container';
import { theme } from '../theme';
import { apiClient } from '../api/client';

export const BlockedUsersScreen = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    const { data: blockedUsers, isLoading } = useQuery({
        queryKey: ['blocked-users'],
        queryFn: async () => {
            const response = await apiClient.get('/blocks');
            return response.data.data;
        },
    });

    const unblockMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiClient.delete(`/blocks/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
            Alert.alert('Thành công', 'Đã bỏ chặn người dùng này');
        },
        onError: () => {
            Alert.alert('Lỗi', 'Không thể bỏ chặn người dùng');
        },
    });

    const handleUnblock = (userId: string, username: string) => {
        Alert.alert(
            'Xác nhận bỏ chặn',
            `Bạn có chắc chắn muốn bỏ chặn ${username}? Họ sẽ có thể gửi lời mời kết bạn và tin nhắn cho bạn.`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Bỏ chặn', style: 'default', onPress: () => unblockMutation.mutate(userId) },
            ]
        );
    };

    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={theme.colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Người dùng đã chặn</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <UserX size={48} color={theme.colors.textMuted} />
                            <Text style={styles.emptyText}>Bạn chưa chặn người dùng nào</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            {item.blocked.avatarUrl ? (
                                <Image source={{ uri: item.blocked.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>{item.blocked.username.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.username}>{item.blocked.username}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.unblockButton}
                                onPress={() => handleUnblock(item.blocked.id, item.blocked.username)}
                            >
                                <Text style={styles.unblockText}>Bỏ chặn</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    listContainer: {
        padding: theme.spacing.lg,
        flexGrow: 1,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: '#1E293B',
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    username: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    unblockButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    unblockText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 16,
    },
});
