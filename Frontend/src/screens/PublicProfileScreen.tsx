import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gamepad2, Heart, Trophy, ChevronLeft, MapPin, Search, UserX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert } from 'react-native';

import { Container } from '../components/Container';
import { theme, getBorderColorById } from '../theme';
import { apiClient } from '../api/client';
import { UserPublicProfile, UserGameProfile } from '../types';
import { RANK_COLORS, getRankDisplay } from '../utils/rank';
import { STRINGS } from '../constants/strings';
import { useAuthStore } from '../store/useAuthStore';

export const PublicProfileScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const { userId } = route.params as { userId: string };
    const currentUserId = useAuthStore(state => state.user?.id);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['public-profile', userId],
        queryFn: async () => {
            const response = await apiClient.get(`/users/${userId}`);
            return response.data.data as UserPublicProfile;
        },
    });

    // Get games for this user (could be fetched via another endpoint or included in public profile)
    // For now, let's assume the API doesn't return game profiles in /users/:id.
    // Wait, according to the backend, it only returns `profile` (bio, playStyle, timezone).
    // I'll skip listing game profiles if not available, or we could fetch them if there's an endpoint.
    // Actually, let's just show bio and stats for now.

    const toggleLikeMutation = useMutation({
        mutationFn: async (isLiked: boolean) => {
            if (isLiked) {
                await apiClient.delete(`/users/${userId}/like`);
            } else {
                await apiClient.post(`/users/${userId}/like`);
            }
        },
        onMutate: async (isLiked) => {
            await queryClient.cancelQueries({ queryKey: ['public-profile', userId] });
            const previousProfile = queryClient.getQueryData(['public-profile', userId]) as UserPublicProfile;
            if (previousProfile) {
                queryClient.setQueryData(['public-profile', userId], {
                    ...previousProfile,
                    isLikedByMe: !isLiked,
                    likeCount: isLiked ? previousProfile.likeCount - 1 : previousProfile.likeCount + 1,
                });
            }
            return { previousProfile };
        },
        onError: (err, variables, context) => {
            if (context?.previousProfile) {
                queryClient.setQueryData(['public-profile', userId], context.previousProfile);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
        },
    });

    const sendFriendRequestMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/friends/request/${userId}`);
        },
        onSuccess: () => {
            // Optional: show a toast or alert
            queryClient.invalidateQueries({ queryKey: ['friends', 'status', userId] });
        }
    });

    const blockUserMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/blocks/${userId}`);
        },
        onSuccess: () => {
            Alert.alert('Thành công', 'Đã chặn người dùng này');
            // Go back because we likely don't want to see their profile anymore
            navigation.goBack();
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Không thể chặn người dùng';
            Alert.alert('Lỗi', Array.isArray(message) ? message[0] : message);
        }
    });

    const handleBlock = () => {
        Alert.alert(
            'Chặn người dùng',
            'Bạn có chắc chắn muốn chặn người này? \n• Sẽ xóa bạn bè (nếu có)\n• Sẽ không thể mời nhau vào zone\n• Không thể gửi tin nhắn',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Chặn', style: 'destructive', onPress: () => blockUserMutation.mutate() }
            ]
        );
    };

    const isMe = currentUserId === userId;

    if (isLoading) {
        return (
            <Container>
                <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 50 }} />
            </Container>
        );
    }

    if (!profile) {
        return (
            <Container>
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Người dùng không tồn tại</Text>
            </Container>
        );
    }

    return (
        <Container>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>HỒ SƠ</Text>
                {!isMe ? (
                    <TouchableOpacity style={styles.blockButtonTop} onPress={handleBlock}>
                        <UserX color={theme.colors.error} size={20} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 42 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <LinearGradient
                        colors={['rgba(37,99,255,0.15)', 'rgba(124,58,237,0.08)']}
                        style={styles.heroCardBg}
                    />

                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            {profile.avatarUrl ? (
                                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" transition={500} />
                            ) : (
                                <LinearGradient colors={['#2563FF', '#7C3AED']} style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>
                                        {profile.username?.charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                        </View>

                        <View style={styles.userInfo}>
                            <Text style={styles.username}>{profile.username}</Text>
                            {profile.profile?.playStyle && (
                                <View style={styles.playStyleBadge}>
                                    <Gamepad2 size={12} color={theme.colors.primary} />
                                    <Text style={styles.playStyleText}>{profile.profile.playStyle}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.bioDivider} />
                    <Text style={styles.bioText}>
                        {profile.profile?.bio || STRINGS.BIO_PLACEHOLDER}
                    </Text>

                    {!isMe && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, profile.isLikedByMe && styles.actionBtnActive]}
                                onPress={() => toggleLikeMutation.mutate(profile.isLikedByMe)}
                            >
                                <Heart size={18} color={profile.isLikedByMe ? '#EF4444' : '#fff'} fill={profile.isLikedByMe ? '#EF4444' : 'transparent'} />
                                <Text style={styles.actionBtnText}>{profile.isLikedByMe ? 'Đã thích' : 'Thích'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => sendFriendRequestMutation.mutate()}
                                disabled={sendFriendRequestMutation.isPending}
                            >
                                <Text style={styles.actionBtnPrimaryText}>Kết bạn</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <LinearGradient colors={['#EF444420', '#EF444405']} style={styles.statIconBg}>
                            <Heart size={20} color="#EF4444" />
                        </LinearGradient>
                        <Text style={styles.statValue}>{profile.likeCount || 0}</Text>
                        <Text style={styles.statLabel}>Lượt thích</Text>
                    </View>
                </View>
            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: 1.5,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    blockButtonTop: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: 'rgba(239,68,68,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    heroCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    heroCardBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    avatarWrapper: {
        width: 80,
        height: 80,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'rgba(37,99,255,0.5)',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(37,99,255,0.4)',
    },
    avatarInitial: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: '900',
    },
    userInfo: {
        flex: 1,
        gap: 6,
    },
    username: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.text,
    },
    playStyleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(37,99,255,0.12)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(37,99,255,0.2)',
    },
    playStyleText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary,
        textTransform: 'uppercase',
    },
    bioDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionBtnActive: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    actionBtnPrimary: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
    },
    actionBtnPrimaryText: {
        color: '#fff',
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
    },
});
