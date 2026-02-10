import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Award } from 'lucide-react-native';
import { Container } from '../components/Container';
import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay } from '../utils/rank';

type GameZonesScreenRouteProp = RouteProp<RootStackParamList, 'GameZones'>;

export const GameZonesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GameZonesScreenRouteProp>();
  const { gameId, gameName } = route.params;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['zones', gameId],
    queryFn: async () => {
      const response = await apiClient.get('/zones?page=1&limit=50');
      const allZones = response.data.data.data as Zone[];
      return allZones.filter(zone => zone.gameId === gameId);
    },
  });

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const borderColor = getBorderColorById(item.id);
    const currentPlayers = 1; // TODO: Add participants count from API
    const maxPlayers = item.requiredPlayers;

    return (
      <TouchableOpacity
        style={[styles.zoneCard, { borderColor, borderLeftWidth: 6 }]}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.gameTag, { color: borderColor }]}>
              {item.game?.name || gameName}
            </Text>
            <Text style={styles.zoneTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === 'OPEN'
                    ? theme.colors.success
                    : theme.colors.textSecondary,
              },
            ]}
          />
        </View>

        <Text style={styles.zoneDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View
            style={[styles.badgePill, { borderColor: theme.colors.border }]}
          >
            <Users size={14} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>
              {currentPlayers}/{maxPlayers}
            </Text>
          </View>
          <View
            style={[styles.badgePill, { borderColor: theme.colors.border }]}
          >
            <Award size={14} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>
              {getRankDisplay(item.minRankLevel)} - {getRankDisplay(item.maxRankLevel)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <ArrowLeft color={theme.colors.text} size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{gameName}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  return (
    <Container>
      {renderHeader()}
      <FlatList
        data={data}
        renderItem={renderZoneItem}
        keyExtractor={item => item.id}
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
              <Text style={styles.emptyText}>
                Chưa có phòng nào cho game này
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateZone', { gameId })}
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
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  zoneCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameTag: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  zoneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  zoneDesc: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: theme.colors.background,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
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
