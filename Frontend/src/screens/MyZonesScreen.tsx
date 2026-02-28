import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Animated
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Users,
  Trophy,
  Clock,
  Gamepad2,
  Settings,
  ChevronRight,
  MoreVertical,
  Eye,
  Calendar,
  Star,
  Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay, getRankColor } from '../utils/rank';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'OPEN':
      return {
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.12)',
        label: 'OPEN',
        icon: '🟢',
      };
    case 'FULL':
      return {
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.12)',
        label: 'FULL',
        icon: '🟡',
      };
    case 'CLOSED':
      return {
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.12)',
        label: 'CLOSED',
        icon: '🔴',
      };
    default:
      return {
        color: '#64748B',
        bg: 'rgba(100,116,139,0.12)',
        label: 'UNKNOWN',
        icon: '⚪',
      };
  }
};

const AnimatedStatusDot = ({ status }: { status: string }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = getStatusConfig(status);

  useEffect(() => {
    if (status === 'OPEN') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [status]);

  return (
    <View style={styles.statusDotContainer}>
      {status === 'OPEN' && (
        <Animated.View
          style={[
            styles.statusDotPulse,
            {
              backgroundColor: config.color,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [0.5, 0],
              }),
            },
          ]}
        />
      )}
      <View style={[styles.statusDotCore, { backgroundColor: config.color }]} />
    </View>
  );
};

export const MyZonesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }, []),
  );

  const {
    data: zones = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-zones'],
    queryFn: async () => {
      const response = await apiClient.get('/zones/my');
      return response.data.data as Zone[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      await apiClient.delete(`/zones/${zoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-zones'] });
      Alert.alert('Thành công', 'Đã xóa phòng');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xóa phòng');
    },
  });

  const handleDelete = (zoneId: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa phòng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(zoneId),
      },
    ]);
  };

  const handleEdit = (zoneId: string) => {
    Alert.alert('Sắp ra mắt', 'Tính năng chỉnh sửa đang được phát triển');
  };

  const handleOptions = (zone: Zone) => {
    Alert.alert(
      zone.title,
      'Chọn hành động',
      [
        {
          text: 'Xem chi tiết',
          onPress: () =>
            navigation.navigate('ZoneDetails', { zoneId: zone.id }),
        },
        {
          text: 'Chỉnh sửa',
          onPress: () => handleEdit(zone.id),
        },
        {
          text: 'Xóa phòng',
          onPress: () => handleDelete(zone.id),
          style: 'destructive',
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const renderZoneItem = ({ item, index }: { item: Zone; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const requests = item.joinRequests || [];
    const pendingCount = requests.filter(
      (r: any) => r.status === 'PENDING',
    ).length;
    const approvedCount = requests.filter(
      (r: any) => r.status === 'APPROVED',
    ).length;
    const currentPlayers = approvedCount + 1;
    const rankColor = getRankColor(item.minRankLevel);

    return (
      <View style={styles.timelineItem}>
        {/* Timeline Line */}
        {index !== zones.length - 1 && <View style={styles.timelineLine} />}

        {/* Timeline Node */}
        <View style={styles.timelineNode}>
          <View
            style={[
              styles.timelineNodeOuter,
              { borderColor: statusConfig.color },
            ]}
          >
            <AnimatedStatusDot status={item.status} />
          </View>
        </View>

        {/* Content Card */}
        <TouchableOpacity
          style={styles.contentCard}
          onPress={() =>
            navigation.navigate('ZoneDetails', { zoneId: item.id })
          }
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.gameSection}>
              {item.game?.iconUrl ? (
                <View style={styles.gameIconWrapper}>
                  <Image
                    source={{ uri: item.game.iconUrl }}
                    style={styles.gameIcon}
                    contentFit="cover" transition={500} cachePolicy="disk" />
                </View>
              ) : (
                <View
                  style={[styles.gameIconWrapper, styles.gameIconPlaceholder]}
                >
                  <Gamepad2 size={20} color="#2563EB" />
                </View>
              )}
              <View style={styles.gameInfo}>
                <Text style={styles.gameLabel}>Game</Text>
                <Text style={styles.gameName} numberOfLines={1}>
                  {item.game?.name || 'Unknown'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => handleOptions(item)}
            >
              <MoreVertical size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
          >
            <Text style={styles.statusEmoji}>{statusConfig.icon}</Text>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.zoneTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            {/* Players */}
            <View style={styles.infoItem}>
              <View style={styles.infoIconBg}>
                <Users size={16} color="#2563EB" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Người chơi</Text>
                <Text style={styles.infoValue}>
                  {currentPlayers}/{item.requiredPlayers + 1}
                </Text>
              </View>
            </View>

            {/* Rank */}
            <View style={styles.infoItem}>
              <View
                style={[
                  styles.infoIconBg,
                  { backgroundColor: rankColor + '20' },
                ]}
              >
                <Trophy size={16} color={rankColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Rank</Text>
                <Text style={styles.infoValue}>
                  {getRankDisplay(item.minRankLevel)} - {getRankDisplay(item.maxRankLevel)}
                </Text>
              </View>
            </View>
          </View>

          {/* Pending Requests Alert */}
          {pendingCount > 0 && (
            <View style={styles.pendingAlert}>
              <View style={styles.pendingAlertLeft}>
                <View style={styles.pendingIcon}>
                  <Clock size={16} color="#F59E0B" />
                </View>
                <Text style={styles.pendingText}>
                  <Text style={styles.pendingCount}>{pendingCount}</Text> yêu
                  cầu đang chờ duyệt
                </Text>
              </View>
              <Zap size={16} color="#F59E0B" />
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.dateInfo}>
              <Calendar size={14} color="#94A3B8" />
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('ZoneDetails', { zoneId: item.id })
              }
            >
              <Eye size={16} color="#2563EB" />
              <Text style={styles.viewButtonText}>Xem chi tiết</Text>
              <ChevronRight size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.colors.text} size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Quản lý phòng</Text>
          <Text style={styles.headerSubtitle}>
            {zones.length} phòng đang hoạt động
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : zones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyCircle1} />
            <View style={styles.emptyCircle2} />
            <Gamepad2 size={64} color="#2563EB" strokeWidth={1.5} />
          </View>

          <Text style={styles.emptyTitle}>Chưa có phòng nào</Text>
          <Text style={styles.emptyText}>
            Hãy tạo phòng đầu tiên để bắt đầu tìm kiếm đồng đội cùng chơi game
            nhé!
          </Text>

          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => navigation.navigate('CreateZone')}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
            <Text style={styles.emptyCreateButtonText}>Tạo phòng đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={zones}
          renderItem={renderZoneItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {!isLoading && zones.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('CreateZone')}
          activeOpacity={0.85}
        >
          <View style={styles.fabGradient}>
            <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Timeline Layout
  listContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 28,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -28,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  timelineNode: {
    marginRight: 16,
    paddingTop: 8,
  },
  timelineNodeOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDotContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Content Card
  contentCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  gameIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameIcon: {
    width: '100%',
    height: '100%',
  },
  gameIconPlaceholder: {
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zoneTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Pending Alert
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pendingAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pendingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
    flex: 1,
  },
  pendingCount: {
    fontWeight: '800',
    color: '#F59E0B',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37,99,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.2)',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  emptyCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37,99,255,0.08)',
  },
  emptyCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37,99,255,0.12)',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
