import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  User,
  Shield,
  Gamepad2,
  Monitor,
  Smartphone,
  MessageCircle,
  Hash,
  Check,
  X,
} from 'lucide-react-native';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay } from '../utils/rank';
import { useAuthStore } from '../store/useAuthStore';

type ZoneDetailsRouteProp = RouteProp<RootStackParamList, 'ZoneDetails'>;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return theme.colors.neonGreen;
    case 'FULL':
      return theme.colors.warning;
    case 'CLOSED':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
};

const PulseDot = ({ color }: { color: string }) => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            backgroundColor: color,
            transform: [{ scale: anim }],
            opacity: anim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [0.6, 0],
            }),
          },
        ]}
      />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
};

export const ZoneDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ZoneDetailsRouteProp>();
  const { zoneId } = route.params;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
  }>({ visible: false, title: '', message: '', type: 'info' });

  const hideModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setModalConfig({ visible: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Xác nhận') => {
    setModalConfig({ visible: true, title, message, type: 'confirm', onConfirm, confirmText });
  };

  const {
    data: zone,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['zone', zoneId],
    queryFn: async () => {
      const response = await apiClient.get(`/zones/${zoneId}/public`);
      return response.data.data as Zone;
    },
  });

  const isOwner = currentUser?.id === zone?.ownerId;

  const { data: rawJoinRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['zone-requests', zoneId],
    queryFn: async () => {
      const response = await apiClient.get(`/zones/${zoneId}/requests`);
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    enabled: !!currentUser && isOwner,
  });

  const { data: myJoinRequests } = useQuery({
    queryKey: ['my-join-requests'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/join-requests');
      // Backend wraps all responses in { data: ..., success: true }
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    enabled: !!currentUser && !isOwner,
  });

  // Luôn đảm bảo là array dù API trả về bất kỳ dạng nào
  const joinRequests: { id: string; status: string; user: { id: string; username: string; avatarUrl?: string | null } }[] =
    Array.isArray(rawJoinRequests) ? rawJoinRequests : [];

  const pendingRequests = joinRequests.filter(r => r.status === 'PENDING');

  const hasPendingRequest = Array.isArray(myJoinRequests)
    ? myJoinRequests.some((r: any) => r.zoneId === zoneId && r.status === 'PENDING')
    : false;

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'APPROVED' | 'REJECTED' }) => {
      await apiClient.patch(`/zones/${zoneId}/requests/${requestId}`, { action });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['zone-requests', zoneId] });
      queryClient.invalidateQueries({ queryKey: ['zone', zoneId] });
      hideModal();
      setTimeout(() => {
        showAlert('Thành công', action === 'APPROVED' ? 'Đã chấp nhận yêu cầu!' : 'Đã từ chối yêu cầu.', 'success');
      }, 300);
    },
    onError: () => {
      hideModal();
      setTimeout(() => showAlert('Lỗi', 'Không thể xử lý yêu cầu.', 'error'), 300);
    },
  });

  const handleReview = (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    const label = action === 'APPROVED' ? 'chấp nhận' : 'từ chối';
    showConfirm('Xác nhận', `Bạn muốn ${label} yêu cầu này?`, () => {
      reviewMutation.mutate({ requestId, action });
    }, label.charAt(0).toUpperCase() + label.slice(1));
  };

  const handleRequestJoin = () => {
    if (hasPendingRequest) {
      showConfirm('Hủy yêu cầu', 'Bạn muốn hủy yêu cầu tham gia phòng này?', async () => {
        try {
          await apiClient.delete(`/zones/${zoneId}/join`);
          hideModal();
          queryClient.invalidateQueries({ queryKey: ['my-join-requests'] });
          setTimeout(() => showAlert('Thành công', 'Đã hủy yêu cầu tham gia!', 'success'), 300);
        } catch (e: any) {
          hideModal();
          setTimeout(() => showAlert('Lỗi', e.response?.data?.message || 'Không thể hủy yêu cầu.', 'error'), 300);
        }
      }, 'Hủy yêu cầu');
    } else {
      showConfirm('Gửi yêu cầu', 'Bạn muốn tham gia phòng này?', async () => {
        try {
          await apiClient.post(`/zones/${zoneId}/join`);
          hideModal();
          queryClient.invalidateQueries({ queryKey: ['my-join-requests'] });
          setTimeout(() => showAlert('Thành công', 'Đã gửi yêu cầu tham gia!', 'success'), 300);
        } catch (e: any) {
          hideModal();
          setTimeout(() => showAlert('Lỗi', e.response?.data?.message || 'Không thể gửi yêu cầu.', 'error'), 300);
        }
      }, 'Gửi yêu cầu');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Container>
    );
  }

  if (error || !zone) {
    return (
      <Container>
        <View style={styles.center}>
          <Text style={styles.errorText}>Không thể tải thông tin phòng</Text>
          <Button title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (navigation as any).navigate('MainTabs');
            }
          }}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Sảnh chờ
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: getStatusColor(zone.status) + '40',
                backgroundColor: getStatusColor(zone.status) + '10',
              },
            ]}
          >
            {zone.status === 'OPEN' ? (
              <PulseDot color={getStatusColor(zone.status)} />
            ) : (
              <View
                style={[
                  styles.staticDot,
                  { backgroundColor: getStatusColor(zone.status) },
                ]}
              />
            )}
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(zone.status) },
              ]}
            >
              {zone.status === 'OPEN'
                ? 'ĐANG TÌM NGƯỜI'
                : zone.status === 'FULL'
                  ? 'ĐÃ ĐẦY'
                  : 'ĐÃ ĐÓNG'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{zone.title}</Text>
        <Text style={styles.description}>{zone.description}</Text>

        {/* Game Info - Modern Card */}
        {zone.game && (
          <View style={styles.gameCard}>
            <View style={styles.gameIconContainer}>
              <Image
                source={{ uri: zone.game.iconUrl }}
                style={styles.gameIcon}
                contentFit="cover" transition={500} cachePolicy="disk" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameLabel}>Game</Text>
              <Text style={styles.gameName}>{zone.game.name}</Text>
              {zone.game.platforms && zone.game.platforms.length > 0 && (
                <View style={styles.platformBadges}>
                  {zone.game.platforms.map((platform, idx) => (
                    <View key={idx} style={styles.platformBadge}>
                      {platform === 'PC' && (
                        <Monitor size={12} color={theme.colors.primary} />
                      )}
                      {platform === 'CONSOLE' && (
                        <Gamepad2 size={12} color={theme.colors.primary} />
                      )}
                      {platform === 'MOBILE' && (
                        <Smartphone size={12} color={theme.colors.primary} />
                      )}
                      <Text style={styles.platformText}>{platform}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Gamepad2
              color={theme.colors.primary}
              size={24}
              style={{ opacity: 0.5 }}
            />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBg}>
              <Users color={theme.colors.accent} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>{zone.requiredPlayers}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Cần thêm</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Trophy color={theme.colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {getRankDisplay(zone.minRankLevel)} - {getRankDisplay(zone.maxRankLevel)}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>Yêu cầu Trình</Text>
            </View>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên</Text>
          <View style={styles.participantsContainer}>
            <View style={styles.avatarStack}>
              {/* Owner Avatar */}
              <View style={styles.participantAvatarWrapper}>
                {zone.owner?.avatarUrl ? (
                  <Image
                    source={{ uri: zone.owner.avatarUrl }}
                    style={styles.participantAvatar}
                    contentFit="cover" transition={500} cachePolicy="disk" />
                ) : (
                  <View
                    style={[styles.participantAvatar, styles.placeholderAvatar]}
                  >
                    <Text style={styles.avatarLetter}>
                      {zone.owner?.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.ownerBadgeIcon}>
                  <Shield size={10} color="#FFF" fill={theme.colors.primary} />
                </View>
              </View>

              {/* Empty Slots */}
              {Array.from({ length: Math.min(zone.requiredPlayers, 3) }).map(
                (_, i) => (
                  <View
                    key={`empty-slot-${i}`}
                    style={[styles.participantAvatar, styles.emptySlot]}
                  >
                    <User
                      color={theme.colors.textSecondary}
                      size={20}
                      style={{ opacity: 0.5 }}
                    />
                  </View>
                ),
              )}

              {zone.requiredPlayers > 3 && (
                <View style={[styles.participantAvatar, styles.moreSlots]}>
                  <Text style={styles.moreSlotsText}>
                    +{zone.requiredPlayers - 3}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.slotCountText}>
              Còn trống{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {zone.requiredPlayers}
              </Text>{' '}
              slot
            </Text>
          </View>
        </View>

        {/* Tags */}
        {zone.tags && zone.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {zone.tags.map(tagRelation => (
              <View key={tagRelation.tag.id} style={styles.tag}>
                <Text style={styles.tagText}>#{tagRelation.tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contact Methods */}
        {zone.contacts && zone.contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liên hệ</Text>
            <View style={styles.contactsContainer}>
              {zone.contacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactIcon}>
                    {contact.type === 'DISCORD' && (
                      <MessageCircle size={16} color={theme.colors.primary} />
                    )}
                    {contact.type === 'INGAME' && (
                      <Gamepad2 size={16} color={theme.colors.primary} />
                    )}
                    {contact.type === 'OTHER' && (
                      <Hash size={16} color={theme.colors.primary} />
                    )}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactType}>
                      {contact.type === 'DISCORD'
                        ? 'Discord'
                        : contact.type === 'INGAME'
                          ? 'In-Game'
                          : 'Other'}
                    </Text>
                    <Text style={styles.contactValue}>{contact.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chủ phòng</Text>
          <View style={styles.ownerCard}>
            {zone.owner?.avatarUrl ? (
              <Image
                source={{ uri: zone.owner.avatarUrl }}
                style={styles.ownerAvatar}
                contentFit="cover" transition={500} cachePolicy="disk" />
            ) : (
              <View style={styles.ownerAvatarPlaceholder}>
                <User color={theme.colors.text} size={24} />
              </View>
            )}
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>
                {zone.owner?.username ?? 'Unknown'}
              </Text>
              <View style={styles.ownerMeta}>
                <Clock color={theme.colors.textSecondary} size={12} />
                <Text style={styles.ownerDate}>
                  Tham gia{' '}
                  {new Date(zone.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Join Requests Section — Owner only */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Yêu cầu tham gia{pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}
            </Text>
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyRequestsBox}>
                <Users color={theme.colors.textMuted} size={28} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyRequestsText}>Chưa có yêu cầu nào đang chờ</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {pendingRequests.map(req => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestUserRow}>
                      {req.user.avatarUrl ? (
                        <Image source={{ uri: req.user.avatarUrl }} style={styles.requestAvatar} contentFit="cover" cachePolicy="disk" />
                      ) : (
                        <View style={[styles.requestAvatar, styles.requestAvatarPlaceholder]}>
                          <Text style={styles.requestAvatarLetter}>{req.user.username?.[0]?.toUpperCase() ?? '?'}</Text>
                        </View>
                      )}
                      <Text style={styles.requestUsername}>{req.user.username}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.requestBtn, styles.rejectBtn]}
                        onPress={() => handleReview(req.id, 'REJECTED')}
                        disabled={reviewMutation.isPending}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.requestBtn, styles.approveBtn]}
                        onPress={() => handleReview(req.id, 'APPROVED')}
                        disabled={reviewMutation.isPending}
                      >
                        <Check size={16} color="#22C55E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Glass Footer */}
      {zone.status === 'OPEN' && !isOwner && (
        <View style={styles.footer}>
          <View style={styles.glassBackground} />
          <TouchableOpacity
            style={[styles.actionButton, hasPendingRequest && styles.actionButtonPending]}
            onPress={handleRequestJoin}
            activeOpacity={0.9}
          >
            <Text style={[styles.actionButtonText, hasPendingRequest && styles.actionButtonTextPending]}>
              {hasPendingRequest ? 'Hủy yêu cầu tham gia' : 'Gửi yêu cầu tham gia'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Alert/Confirm Modal */}
      <Modal
        visible={modalConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={hideModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <View style={[styles.alertIconBox, { backgroundColor: modalConfig.type === 'error' ? 'rgba(239,68,68,0.1)' : modalConfig.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(37,99,255,0.1)' }]}>
              {modalConfig.type === 'error' ? (
                <X size={24} color="#EF4444" />
              ) : modalConfig.type === 'success' ? (
                <Check size={24} color="#22C55E" />
              ) : (
                <MessageCircle size={24} color="#2563FF" />
              )}
            </View>
            <Text style={styles.alertTitle}>{modalConfig.title}</Text>
            <Text style={styles.alertMessage}>{modalConfig.message}</Text>
            <View style={styles.alertActions}>
              {modalConfig.type === 'confirm' ? (
                <>
                  <TouchableOpacity style={[styles.alertButton, styles.alertCancelButton]} onPress={hideModal} activeOpacity={0.8}>
                    <Text style={[styles.alertButtonText, { color: theme.colors.textSecondary }]}>Hủy bỏ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.alertButton, styles.alertConfirmButton]} onPress={modalConfig.onConfirm} activeOpacity={0.8}>
                    <Text style={[styles.alertButtonText, { color: '#FFF' }]}>{modalConfig.confirmText}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.alertButton, styles.alertConfirmButton]} onPress={hideModal} activeOpacity={0.8}>
                  <Text style={[styles.alertButtonText, { color: '#FFF' }]}>Đóng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#0F172A',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statusContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  staticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: theme.spacing.md,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gameIconContainer: {
    marginRight: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  platformBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  platformText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,99,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: theme.spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatarWrapper: {
    position: 'relative',
    marginRight: -10,
    zIndex: 10,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  placeholderAvatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  ownerBadgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: 1,
  },
  emptySlot: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    marginLeft: -10,
  },
  moreSlots: {
    backgroundColor: 'rgba(37,99,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    marginLeft: -10,
  },
  moreSlotsText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  slotCountText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.xl,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: theme.spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(37,99,255,0.5)',
  },
  ownerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37,99,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(37,99,255,0.4)',
  },
  ownerInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  ownerName: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ownerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: 6,
  },
  contactsContainer: {
    gap: theme.spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,99,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactType: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  actionButton: {
    overflow: 'hidden',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionButtonPending: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonTextPending: {
    color: '#EF4444',
  },
  // Join Requests
  emptyRequestsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyRequestsText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  requestsList: {
    gap: 10,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  requestUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  requestAvatarPlaceholder: {
    backgroundColor: 'rgba(37,99,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAvatarLetter: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  requestUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  approveBtn: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  // Custom Alert
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
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCancelButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  alertConfirmButton: {
    backgroundColor: theme.colors.primary,
  },
  alertButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
