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
  Image,
  StatusBar,
} from 'react-native';
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay } from '../utils/rank';

const StatusBadge = ({ status }: { status: string }) => {
  let color = theme.colors.textSecondary;
  let text = status;
  let bg = theme.colors.surfaceLight;

  switch (status) {
    case 'OPEN':
      color = theme.colors.success;
      bg = 'rgba(34, 197, 94, 0.1)';
      text = 'ĐANG MỞ';
      break;
    case 'FULL':
      color = theme.colors.warning;
      bg = 'rgba(234, 179, 8, 0.1)';
      text = 'ĐÃ ĐẦY';
      break;
    case 'CLOSED':
      color = theme.colors.error;
      bg = 'rgba(239, 68, 68, 0.1)';
      text = 'ĐÃ ĐÓNG';
      break;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
};

export const MyZonesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // StatusBar handling
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
      // Backend returns array wrapped in data object
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
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa phòng này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(zoneId),
      },
    ]);
  };

  const handleEdit = (zoneId: string) => {
    Alert.alert('Coming soon', 'Tính năng chỉnh sửa đang phát triển');
  };

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const borderColor = getBorderColorById(item.id);

    // Calculate stats
    // Note: item.joinRequests is array of { status } objects from backend include
    const requests = item.joinRequests || [];
    const pendingCount = requests.filter(
      (r: any) => r.status === 'PENDING',
    ).length;
    const approvedCount = requests.filter(
      (r: any) => r.status === 'APPROVED',
    ).length;
    const currentPlayers = approvedCount + 1; // +1 for owner

    return (
      <TouchableOpacity
        style={[styles.zoneCard, { borderLeftColor: borderColor }]}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.9}
      >
        {/* Header: Game & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.gameInfo}>
            {item.game?.iconUrl ? (
              <Image
                source={{ uri: item.game.iconUrl }}
                style={styles.gameIcon}
              />
            ) : (
              <View
                style={[
                  styles.gameIcon,
                  { backgroundColor: theme.colors.surfaceLight },
                ]}
              >
                <Gamepad2 size={16} color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.gameName}>
              {item.game?.name || 'Unknown Game'}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Content */}
        <Text style={styles.zoneTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>
              {currentPlayers}/{item.requiredPlayers}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Trophy size={14} color={theme.colors.accent} />
            <Text style={styles.statText}>
              {getRankDisplay(item.minRankLevel)}
            </Text>
          </View>

          {pendingCount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={[styles.pendingBadge]}>
                <Clock size={12} color={theme.colors.warning} />
                <Text style={styles.pendingText}>{pendingCount} chờ duyệt</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() =>
              navigation.navigate('ZoneDetails', { zoneId: item.id })
            }
          >
            <Settings size={14} color={theme.colors.primary} />
            <Text style={styles.manageText}>Quản lý</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.info + '15' },
              ]}
              onPress={() => handleEdit(item.id)}
            >
              <Edit2 color={theme.colors.info} size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.error + '15' },
              ]}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 color={theme.colors.error} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <ArrowLeft color={theme.colors.text} size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Quản lý phòng</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.container}>
      {renderHeader()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : zones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Gamepad2 size={48} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có phòng nào</Text>
          <Text style={styles.emptyText}>
            Bạn chưa tạo phòng chơi nào. Hãy tạo ngay để tìm đồng đội!
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateZone')}
          >
            <Plus color="#FFF" size={20} />
            <Text style={styles.createButtonText}>Tạo phòng mới</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* FAB - Only show if list not empty to avoid duplicate CTA */}
      {!isLoading && zones.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => navigation.navigate('CreateZone')}
          activeOpacity={0.9}
        >
          <Plus color="#FFF" size={28} />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingTop: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Zone Card
  zoneCard: {
    backgroundColor: '#FFF',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '700',
  },

  // Footer Actions
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceLight,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
