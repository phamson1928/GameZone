import React, { useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Users,
  Mic,
  Zap,
  Gamepad2,
  Trophy
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone, Game } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay } from '../utils/rank';

type TeamZoneVNsScreenRouteProp = RouteProp<RootStackParamList, 'TeamZoneVNs'>;

const CardPulseDot = ({ color }: { color: string }) => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <View style={styles.statusContainer}>
      <Animated.View
        style={[
          styles.statusPulse,
          {
            backgroundColor: color,
            transform: [{ scale: anim }],
            opacity: anim.interpolate({ inputRange: [1, 1.8], outputRange: [0.5, 0] }),
          },
        ]}
      />
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    </View>
  );
};

export const TeamZoneVNsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TeamZoneVNsScreenRouteProp>();
  const { gameId, gameName } = route.params;
  const insets = useSafeAreaInsets();

  const { data: game, isLoading: isLoadingGame } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const response = await apiClient.get(`/games/${gameId}`);
      return response.data.data as Game;
    },
  });

  const { data: zones = [], isLoading: isLoadingZones, refetch } = useQuery({
    queryKey: ['zones', gameId],
    queryFn: async () => {
      const response = await apiClient.get('/zones/search', {
        params: { gameId, limit: 50 },
      });
      return response.data.data.data as Zone[];
    },
  });

  const isLoading = isLoadingGame || isLoadingZones;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      return () => {
        StatusBar.setBarStyle('light-content');
        StatusBar.setBackgroundColor('transparent');
      };
    }, []),
  );

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroImageContainer}>
        {game?.bannerUrl ? (
          <Image source={{ uri: game.bannerUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#1a1f3a', '#0F172A']} style={styles.heroImage} />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(15,23,42,0.6)', '#0F172A']}
          style={styles.heroGradient}
        />
      </View>

      <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonBlur}>
            <ArrowLeft color="#FFFFFF" size={22} />
          </View>
        </TouchableOpacity>

        <View style={styles.heroTitleContainer}>
          {game?.iconUrl && (
            <Image source={{ uri: game.iconUrl }} style={styles.heroGameIcon} />
          )}
          <Text style={styles.heroTitle}>{game?.name || gameName}</Text>
          <View style={styles.heroSubRow}>
            <Zap size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.heroSubtitle}>{zones.length} phòng đang mở</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionHeaderText}>DANH SÁCH PHÒNG</Text>
      </View>
      <Text style={styles.sectionCount}>{zones.length} phòng</Text>
    </View>
  );

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const borderColor = getBorderColorById(item.id);
    const approvedCount = item._count?.joinRequests ?? 0;
    const currentPlayers = approvedCount + 1;
    const maxPlayers = item.requiredPlayers;
    const progress = Math.min(currentPlayers / (maxPlayers || 1), 1);

    const micTag = item.tags?.find(t => t.tag?.name?.toLowerCase().includes('mic'));
    const otherTags = item.tags?.filter(t => !t.tag?.name?.toLowerCase().includes('mic')) || [];
    const displayTags = otherTags.slice(0, 3);
    const remainingTags = otherTags.length - 3;

    const getStatusConfig = () => {
      switch (item.status) {
        case 'OPEN': return { color: '#22C55E', label: 'OPEN', bg: 'rgba(34,197,94,0.12)' };
        case 'FULL': return { color: '#EF4444', label: 'FULL', bg: 'rgba(239,68,68,0.12)' };
        case 'CLOSED': return { color: '#64748B', label: 'CLOSED', bg: 'rgba(100,116,139,0.12)' };
        default: return { color: '#94A3B8', label: item.status, bg: 'rgba(148,163,184,0.12)' };
      }
    };

    const statusCfg = getStatusConfig();
    const ownerInitial = item.owner?.username?.charAt(0).toUpperCase() || '?';
    const ownerAvatar = item.owner?.avatarUrl;

    return (
      <TouchableOpacity
        style={styles.zoneCard}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.88}
      >
        {/* Accent left border */}
        <View style={[styles.accentBorder, { backgroundColor: borderColor }]} />

        <View style={styles.cardBody}>
          {/* Header: Owner + Status */}
          <View style={styles.cardHeader}>
            <View style={styles.ownerRow}>
              {ownerAvatar ? (
                <Image source={{ uri: ownerAvatar }} style={styles.ownerAvatar} />
              ) : (
                <View style={[styles.ownerAvatar, { backgroundColor: borderColor + '40' }]}>
                  <Text style={[styles.ownerInitial, { color: borderColor }]}>{ownerInitial}</Text>
                </View>
              )}
              <Text style={styles.ownerName} numberOfLines={1}>
                {item.owner?.username || 'Unknown'}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              {item.status === 'OPEN' ? (
                <CardPulseDot color={statusCfg.color} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              )}
              <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.zoneTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.zoneDesc} numberOfLines={2}>{item.description}</Text>

          {/* Tags */}
          {(otherTags.length > 0 || micTag) && (
            <View style={styles.tagsRow}>
              {micTag && (
                <View style={styles.micBadge}>
                  <Mic size={10} color="#2563FF" />
                  <Text style={styles.micBadgeText}>VOICE</Text>
                </View>
              )}
              {displayTags.map(t => (
                <View key={t.tag.id} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{t.tag.name}</Text>
                </View>
              ))}
              {remainingTags > 0 && (
                <View style={[styles.tagChip, styles.tagOverflow]}>
                  <Text style={styles.tagText}>+{remainingTags}</Text>
                </View>
              )}
            </View>
          )}

          {/* Footer with progress bar */}
          <View style={styles.cardFooter}>
            <View style={styles.playerInfo}>
              <Users size={12} color={theme.colors.textMuted} />
              <Text style={styles.playerText}>
                <Text style={styles.playerCount}>{currentPlayers}</Text>
                <Text style={styles.playerMax}>/{maxPlayers}</Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={['#2563FF', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <View style={styles.rankBadge}>
              <Trophy size={11} color="#F59E0B" />
              <Text style={styles.rankText}>
                {getRankDisplay(item.minRankLevel)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Gamepad2 size={48} color={theme.colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có phòng nào</Text>
      <Text style={styles.emptyText}>
        Hiện tại chưa có phòng chơi nào cho game này.{'\n'}Hãy tạo phòng mới để bắt đầu!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateZone', { gameId })}
      >
        <LinearGradient colors={['#2563FF', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyButtonGradient}>
          <Plus size={18} color="#FFF" />
          <Text style={styles.emptyButtonText}>Tạo phòng ngay</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !zones.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
      ) : (
        <FlatList
          data={zones}
          renderItem={renderZoneItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {renderHeader()}
              {renderSectionHeader()}
            </>
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              progressViewOffset={insets.top + 20}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('CreateZone', { gameId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#2563FF', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFF" size={28} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 120,
  },

  // Hero
  heroContainer: {
    height: 260,
    position: 'relative',
    marginBottom: 0,
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
    height: 260,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroTitleContainer: {
    gap: 6,
  },
  heroGameIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: -0.5,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },

  // Zone Card
  zoneCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: theme.spacing.lg,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  accentBorder: {
    width: 3,
    height: '100%',
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ownerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInitial: {
    fontSize: 11,
    fontWeight: '800',
  },
  ownerName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  statusContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 14,
    height: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Content
  zoneTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  zoneDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  micBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.25)',
  },
  micBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563FF',
    letterSpacing: 0.5,
  },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagOverflow: {
    backgroundColor: 'rgba(37,99,255,0.12)',
    borderColor: 'rgba(37,99,255,0.2)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  playerText: {
    fontSize: 12,
  },
  playerCount: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  playerMax: {
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Empty
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    gap: 12,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(37,99,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
