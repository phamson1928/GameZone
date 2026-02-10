import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { Container } from '../components/Container';
import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { STRINGS } from '../constants/strings';

export const MyZonesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
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
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa phòng này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(zoneId),
        },
      ]
    );
  };

  const handleEdit = (zoneId: string) => {
    Alert.alert('Coming soon', 'Tính năng đang phát triển');
  };

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const borderColor = getBorderColorById(item.id);
    return (
    <TouchableOpacity
      style={[styles.zoneCard, { borderColor, borderLeftWidth: 4 }]}
      onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.zoneTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.gameName}>{item.game?.name || 'Unknown Game'}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Yêu cầu tham gia: </Text>
          <Text style={styles.infoValue}>{item._count?.joinRequests || 0}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => handleEdit(item.id)}
          >
            <Edit2 color={theme.colors.text} size={16} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 color={theme.colors.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ArrowLeft color={theme.colors.text} size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Phòng Của Tôi</Text>
      <View style={{ width: 24 }} /> 
    </View>
  );

  return (
    <Container>
      {renderHeader()}
      <FlatList
        data={data}
        renderItem={renderZoneItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refetch} 
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bạn chưa tạo phòng nào</Text>
            </View>
          ) : null
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateZone')}
      >
        <Plus color={theme.colors.text} size={30} />
      </TouchableOpacity>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 80,
  },
  zoneCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  gameName: {
    color: theme.colors.primary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  editButton: {
    backgroundColor: theme.colors.info,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
