import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Users,
  Zap,
  Search,
  Filter,
  Mic,
  Globe,
  Clock,
  X,
  Check,
  Monitor,
  Smartphone,
  Gamepad,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Container } from '../components/Container';
import { apiClient } from '../api/client';
import { theme, getBorderColorById } from '../theme';
import { Zone, Game, Platform } from '../types';
import { Button } from '../components/Button';
import { Input, InputRef } from '../components/Input';
import { RootStackParamList } from '../navigation';
import {
  NotificationPopover,
  NotificationItem,
} from '../components/NotificationPopover';
import { getRankDisplay } from '../utils/rank';
import { useAuthStore } from '../store/useAuthStore';
import { STRINGS } from '../constants/strings';

const GAME_CARD_WIDTH = 100;

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vừa tạo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `Đã tạo ${days} ngày trước`;
};

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock data for notifications
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New Zone Request',
    message: 'DragonSlayer requested to join your "FPS Pro" zone.',
    time: '2m ago',
    read: false,
    type: 'invite',
  },
  {
    id: '2',
    title: 'System Update',
    message: 'GameZone mobile app is now live with a fresh new look!',
    time: '1h ago',
    read: false,
    type: 'system',
  },
  {
    id: '3',
    title: 'Rank Up!',
    message: 'Congratulations! You reached Gold tier in Valorant.',
    time: '1d ago',
    read: true,
    type: 'info',
  },
];

const CATEGORIES = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'PC', value: 'PC' },
  { label: 'Console', value: 'CONSOLE' },
  { label: 'Mobile', value: 'MOBILE' },
];

type SortOption = 'newest' | 'oldest' | 'players_asc' | 'players_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'players_asc', label: 'Ít người nhất' },
  { value: 'players_desc', label: 'Nhiều người nhất' },
];

// Memoized Search Section to prevent re-renders while typing
// DEPRECATED: Removed to fix mobile focus issues
// const SearchSection = ...

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const tabNavigation = useNavigation<any>(); // For tab navigation
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [submittedSearch, setSubmittedSearch] = useState('');
  // Local state for search text to control Input
  const [searchText, setSearchText] = useState('');

  // Ref for search input focus management
  const searchInputRef = useRef<InputRef>(null);

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    setSubmittedSearch(searchText);
  }, [searchText]);

  // Handle filter button press (stable reference for SearchSection memo)
  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  // Fetch popular games
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 'mobile'],
    queryFn: async () => {
      const response = await apiClient.get('/games/mobile');
      return response.data.data as Game[];
    },
  });

  // Filter games by selected platform category (frontend filtering)
  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (selectedCategory === 'ALL') return games;
    
    return games.filter(game => 
      game.platforms?.includes(selectedCategory as Platform)
    );
  }, [games, selectedCategory]);

  // Fetch zones with search and sort
  const {
    data: zones,
    isLoading: zonesLoading,
    refetch: refetchZones,
  } = useQuery({
    queryKey: ['zones', 'search', submittedSearch, sortBy],
    queryFn: async () => {
      let url = `/zones/search?page=1&limit=20&sortBy=${sortBy}`;
      if (submittedSearch.trim()) {
        url += `&q=${encodeURIComponent(submittedSearch.trim())}`;
      }
      console.log('Fetching zones:', url);
      const response = await apiClient.get(url);
      console.log('Zones response:', response.data?.data?.data?.length);
      return response.data.data.data as Zone[];
    },
  });

  const handleNotificationPress = (item: NotificationItem) => {
    console.log('Pressed notification:', item.title);
    const updated = notifications.map(n =>
      n.id === item.id ? { ...n, read: true } : n,
    );
    setNotifications(updated);
    setShowNotifications(false);
  };

  // Since API handles search and sort, just return zones directly
  const filteredZones = zones || [];

  // Filter Modal Component
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SẮP XẾP THEO</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Check size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderGameCard = useCallback((game: Game) => {
    const accentColor = getBorderColorById(game.id);
    
    // Get platform icon
    const getPlatformIcon = (platform: string) => {
      switch (platform) {
        case 'PC':
          return <Monitor size={10} color="#FFFFFF" />;
        case 'CONSOLE':
          return <Gamepad size={10} color="#FFFFFF" />;
        case 'MOBILE':
          return <Smartphone size={10} color="#FFFFFF" />;
        default:
          return null;
      }
    };
    
    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCardContainer}
        onPress={() =>
          navigation.navigate('GameZones', {
            gameId: game.id,
            gameName: game.name,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.gameCardImageContainer}>
          <Image source={{ uri: game.iconUrl }} style={styles.gameCardImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gameCardOverlay}
          />
          <View style={styles.gameCardBadge}>
            {game.platforms && game.platforms.length > 0 ? (
              <View style={styles.platformBadges}>
                {game.platforms.slice(0, 2).map((platform, idx) => (
                  <View key={idx} style={styles.platformIcon}>
                    {getPlatformIcon(platform)}
                  </View>
                ))}
                {game.platforms.length > 2 && (
                  <Text style={styles.gameCardBadgeText}>+{game.platforms.length - 2}</Text>
                )}
              </View>
            ) : (
              <Text style={styles.gameCardBadgeText}>GAME</Text>
            )}
          </View>
        </View>

        <View style={styles.gameCardInfo}>
          <Text style={styles.gameCardName} numberOfLines={1}>
            {game.name}
          </Text>
          <Text style={[styles.gameCardCount, { color: accentColor }]}>
            {game._count?.zones || 0} zones
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderZoneItem = ({ item }: { item: Zone }) => {
    // Check for "Mic" in tags
    const hasMic =
      item.tags?.some(t => t.tag?.name?.toLowerCase().includes('mic')) ?? false;

    return (
      <TouchableOpacity
        style={styles.zoneCard}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.9}
      >
        <View
          style={[styles.accentBar, { backgroundColor: theme.colors.primary }]}
        />

        <View style={styles.zoneContent}>
          {/* Header: Avatar Stack + Title */}
          <View style={styles.zoneHeader}>
            <View style={styles.avatarStack}>
              {/* Owner Avatar */}
              {item.owner.avatarUrl ? (
                <Image
                  source={{ uri: item.owner.avatarUrl }}
                  style={[styles.avatarStackItem, { zIndex: 3 }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarStackItem,
                    styles.avatarPlaceholder,
                    { zIndex: 3 },
                  ]}
                >
                  <Text style={styles.avatarPlaceholderText}>
                    {item.owner.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {/* Mock participants */}
              <View
                style={[
                  styles.avatarStackItem,
                  styles.avatarPlaceholder,
                  {
                    zIndex: 2,
                    marginLeft: -10,
                    backgroundColor: theme.colors.surfaceLight,
                  },
                ]}
              >
                <Users size={12} color={theme.colors.textSecondary} />
              </View>
            </View>

            <View style={styles.zoneTitleContainer}>
              {/* Game Name Tag */}
              <Text style={styles.zoneGameTag}>
                {item.game?.name || 'GAME'}
              </Text>
              
              <Text style={styles.zoneTitle} numberOfLines={1}>
                {item.title}
              </Text>
              
              <View style={styles.zoneMetaRow}>
                <View style={styles.zoneMetaItem}>
                  <Clock size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.zoneMetaText}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              {/* Use absolute positioning for the ping effect if animation is complex, simple static for now */}
              <View
                style={[
                  styles.liveDotPing,
                  { backgroundColor: theme.colors.success },
                ]}
              />
            </View>
          </View>

          {/* Badges & Join Button */}
          <View style={styles.zoneFooter}>
            <View style={styles.badgesContainer}>
              {hasMic && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.infoBlue + '20' },
                  ]}
                >
                  <Mic size={10} color={theme.colors.infoBlue} />
                  <Text
                    style={[styles.badgeText, { color: theme.colors.infoBlue }]}
                  >
                    CÓ MIC
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.surfaceLight },
                ]}
              >
                <Text style={styles.badgeText}>
                  {getRankDisplay(item.minRankLevel)} - {getRankDisplay(item.maxRankLevel)}
                </Text>
              </View>
            </View>

            <Button
              title="THAM GIA"
              onPress={() =>
                navigation.navigate('ZoneDetails', { zoneId: item.id })
              }
              variant="outline"
              size="sm"
              style={styles.joinButton}
              textStyle={styles.joinButtonText}
            />
          </View>

          {/* Tags */}
          {item.tags && item.tags.filter(t => !t.tag?.name?.toLowerCase().includes('mic')).length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags
                .filter(t => !t.tag?.name?.toLowerCase().includes('mic'))
                .slice(0, 3)
                .map(t => (
                  <View key={t.tag.id} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{t.tag.name}</Text>
                  </View>
                ))}
              {item.tags.filter(t => !t.tag?.name?.toLowerCase().includes('mic')).length > 3 && (
                <View style={[styles.tagChip, styles.tagChipMore]}>
                  <Text style={styles.tagChipMoreText}>
                    +{item.tags.filter(t => !t.tag?.name?.toLowerCase().includes('mic')).length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Memoize renderHeader WITHOUT search - search stays outside FlatList
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* 1. Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            keyboardShouldPersistTaps="handled"
          >
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                title={cat.label}
                variant="pill"
                active={selectedCategory === cat.value}
                onPress={() => setSelectedCategory(cat.value)}
                style={styles.categoryPill}
                size="sm"
              />
            ))}
          </ScrollView>
        </View>

        {/* 2. Popular Games */}
        <View style={styles.gamesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TRÒ CHƠI PHỔ BIẾN</Text>
            <TouchableOpacity
              onPress={() => tabNavigation.navigate('Discover')}
            >
              <Text style={styles.seeAllButton}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gamesScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {gamesLoading ? (
              <View style={styles.gamesLoadingPlaceholder}>
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : filteredGames && filteredGames.length > 0 ? (
              filteredGames.map(game => renderGameCard(game))
            ) : (
              <View style={styles.gamesLoadingPlaceholder}>
                <Text style={styles.loadingText}>Không có game nào</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* 3. Recent Zones Title */}
        <View style={styles.zonesSectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Zap
              size={20}
              color={theme.colors.accent}
              fill={theme.colors.accent}
            />
            <Text style={styles.sectionTitle}>KHU VỰC GỢI Ý</Text>
          </View>
        </View>
      </View>
    ),
    [selectedCategory, filteredGames, gamesLoading, renderGameCard, tabNavigation],
  );

  return (
    <Container disableKeyboardAvoidingView>
      {renderFilterModal()}

      {/* Fixed Header - Outside FlatList to prevent focus loss */}
      <View style={styles.fixedHeader}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatarContainer}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                  <Text style={styles.userAvatarText}>
                    {user?.username?.charAt(0).toUpperCase() || 'G'}
                  </Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.headerTitle}>GAMEZONE</Text>
              <Text style={styles.headerSubtitle}>LOBBY</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Bell color={theme.colors.text} size={20} />
            {notifications.some(n => !n.read) && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchInputContainer, styles.simpleSearchContainer]}>
            <Search size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.simpleSearchInput}
              placeholder="Tìm kiếm zone, game..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
            <Filter size={20} color={theme.colors.text} />
            {sortBy !== 'newest' && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredZones}
        renderItem={renderZoneItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={zonesLoading}
            onRefresh={refetchZones}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !zonesLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{STRINGS.NO_ZONES}</Text>
              <Button
                title={STRINGS.CREATE_FIRST_ZONE}
                onPress={() => navigation.navigate('CreateZone', undefined)}
                style={styles.emptyButton}
              />
            </View>
          ) : null
        }
      />
      <NotificationPopover
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onPressItem={handleNotificationPress}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingBottom: theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary + '33', // 20% opacity
    padding: 2,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  userAvatarPlaceholder: {
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12, // rounded-xl
    backgroundColor: theme.colors.surfaceLight, // bg-slate-100 equivalent
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    marginVertical: 0,
  },
  simpleSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    height: 48,
  },
  simpleSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  sortOptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Categories
  categoriesSection: {
    marginBottom: theme.spacing.xl,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  categoryPill: {
    marginVertical: 0,
  },

  // Games Section
  gamesSection: {
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.sm, // Extra padding for shadow overflow
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllButton: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  gamesScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md, // Add vertical padding for shadow visibility
    gap: 16,
  },
  gamesLoadingPlaceholder: {
    width: 200,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },

  // Game Card
  gameCardContainer: {
    width: GAME_CARD_WIDTH,
    gap: 8,
  },
  gameCardImageContainer: {
    width: GAME_CARD_WIDTH,
    height: GAME_CARD_WIDTH * 1.33, // Aspect ratio 3/4
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surfaceLight,
    // Add shadow to the image container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gameCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gameCardBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  platformBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gameCardInfo: {
    alignItems: 'flex-start',
  },
  gameCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  gameCardCount: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.seaBlue, // Use sea blue for small details
  },

  // Zones Section
  zonesSectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },

  // Zone Card
  zoneCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    height: '100%',
  },
  zoneContent: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatarStackItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoneTitleContainer: {
    flex: 1,
    gap: 4,
  },
  zoneGameTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  zoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  zoneMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneMetaText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  liveIndicator: {
    position: 'relative',
    width: 8,
    height: 8,
    marginTop: 6,
    marginRight: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveDotPing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.4,
  },
  zoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  joinButton: {
    height: 32,
    marginVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tagChipMore: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary + '30',
  },
  tagChipMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Empty State
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    width: '100%',
  },
});
