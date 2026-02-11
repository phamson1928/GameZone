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

type GameZonesScreenRouteProp = RouteProp<RootStackParamList, 'GameZones'>;

const CardPulseDot = ({ color }: { color: string }) => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.8,
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
    <View style={styles.statusContainer}>
      <Animated.View
        style={[
          styles.statusPulse,
          {
            backgroundColor: color,
            transform: [{ scale: anim }],
            opacity: anim.interpolate({
              inputRange: [1, 1.8],
              outputRange: [0.5, 0],
            }),
          },
        ]}
      />
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    </View>
  );
};

export const GameZonesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GameZonesScreenRouteProp>();
  const { gameId, gameName } = route.params;
  const insets = useSafeAreaInsets();

  // 1. Fetch Game Data for Hero
  const { data: game, isLoading: isLoadingGame } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const response = await apiClient.get(`/games/${gameId}`);
      return response.data.data as Game;
    },
  });

  // 2. Fetch Zones (server-side filtered by gameId)
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

  // Set light StatusBar for hero image, restore on leave
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('transparent');
      };
    }, []),
  );

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroImageContainer}>
        {game?.bannerUrl ? (
          <Image 
            source={{ uri: game.bannerUrl }} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.heroImage}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} // Gradient overlay
          style={styles.heroGradient}
        />
        {/* Extra gradient at bottom for smooth blend to background */}
        <LinearGradient
          colors={['transparent', '#f0f4ff']} 
          style={styles.heroBlendGradient}
        />
      </View>

      <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <View style={styles.backButtonBlur}>
            <ArrowLeft color="#FFF" size={24} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.heroTitleContainer}>
          <Text style={styles.heroTitle}>{game?.name || gameName}</Text>
          <Text style={styles.heroSubtitle}>
            {zones.length} phòng đang mở
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <Zap size={16} color={theme.colors.accent} fill={theme.colors.accent} />
      <Text style={styles.sectionHeaderText}>DANH SÁCH PHÒNG</Text>
    </View>
  );

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const borderColor = getBorderColorById(item.id);
    const approvedCount = item._count?.joinRequests ?? 0;
    const currentPlayers = approvedCount + 1; // +1 for owner
    const maxPlayers = item.requiredPlayers;
    
    // Tag Logic
    const micTag = item.tags?.find(t => t.tag?.name?.toLowerCase().includes('mic'));
    const otherTags = item.tags?.filter(t => !t.tag?.name?.toLowerCase().includes('mic')) || [];
    const displayTags = otherTags.slice(0, 3);
    const remainingTags = otherTags.length - 3;

    // Status Logic
    const getStatusColor = () => {
      switch (item.status) {
        case 'OPEN': return theme.colors.success; 
        case 'FULL': return theme.colors.warning;
        case 'CLOSED': return theme.colors.slate;
        default: return theme.colors.textSecondary;
      }
    };

    // Owner Logic
    const ownerInitial = item.owner?.username?.charAt(0).toUpperCase() || '?';
    const ownerAvatar = item.owner?.avatarUrl;

    return (
      <TouchableOpacity
        style={[styles.zoneCard, { borderLeftColor: borderColor }]}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.9}
      >
        {/* Card Header: Owner + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.ownerRow}>
            {ownerAvatar ? (
              <Image source={{ uri: ownerAvatar }} style={styles.ownerAvatar} />
            ) : (
              <View style={[styles.ownerAvatar, { backgroundColor: borderColor }]}>
                <Text style={styles.ownerInitial}>{ownerInitial}</Text>
              </View>
            )}
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.owner?.username || 'Unknown'}
            </Text>
          </View>

          {item.status === 'OPEN' ? (
            <CardPulseDot color={getStatusColor()} />
          ) : (
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            </View>
          )}
        </View>

        {/* Title & Desc */}
        <Text style={styles.zoneTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.zoneDesc} numberOfLines={2}>{item.description}</Text>

        {/* Tags Row */}
        {(otherTags.length > 0 || micTag) && (
          <View style={styles.tagsRow}>
            {micTag && (
              <View style={styles.micBadge}>
                <Mic size={10} color={theme.colors.infoBlue} />
                <Text style={styles.micBadgeText}>MIC</Text>
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

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.badgePill}>
            <Users size={12} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>
              {currentPlayers}/{maxPlayers}
            </Text>
          </View>
          <View style={styles.badgePill}>
            <Trophy size={12} color={theme.colors.accent} />
            <Text style={styles.badgeText}>
              {getRankDisplay(item.minRankLevel)} - {getRankDisplay(item.maxRankLevel)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Gamepad2 size={64} color={theme.colors.border} />
      <Text style={styles.emptyTitle}>Chưa có phòng nào</Text>
      <Text style={styles.emptyText}>
        Hiện tại chưa có phòng chơi nào cho game này. Hãy tạo phòng mới để bắt đầu!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateZone', { gameId })}
      >
        <Plus size={20} color="#FFF" />
        <Text style={styles.emptyButtonText}>Tạo phòng ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#f0f4ff', '#FFFFFF']}
      style={styles.container}
    >
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

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('CreateZone', { gameId })}
        activeOpacity={0.8}
      >
        <Plus color="#FFF" size={28} />
        <Text style={styles.fabText}>Tạo phòng</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  
  // Hero Styles
  heroContainer: {
    height: 240,
    marginBottom: 0,
    position: 'relative',
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBlendGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitleContainer: {
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Zone Card
  zoneCard: {
    backgroundColor: '#FFF',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    // Soft shadow
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  ownerInitial: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ownerName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
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
  
  // Content
  zoneTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  zoneDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  micBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff', // Light blue
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  micBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.infoBlue,
  },
  tagChip: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tagOverflow: {
    backgroundColor: theme.colors.borderLight,
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
    justifyContent: 'flex-start',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceLight,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  // Empty State
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  emptyButton: {
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
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 64, // Slightly larger
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
});
