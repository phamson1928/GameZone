import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  Animated,
  Dimensions,
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
    message: 'TeamZoneVN mobile app is now live with a fresh new look!',
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

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const tabNavigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<InputRef>(null);

  const handleSearchSubmit = useCallback(() => {
    setSubmittedSearch(searchText);
  }, [searchText]);

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

  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (selectedCategory === 'ALL') return games;
    return games.filter(game =>
      game.platforms?.includes(selectedCategory as Platform)
    );
  }, [games, selectedCategory]);

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
      const response = await apiClient.get(url);
      return response.data.data.data as Zone[];
    },
  });

  const handleNotificationPress = (item: NotificationItem) => {
    const updated = notifications.map(n =>
      n.id === item.id ? { ...n, read: true } : n,
    );
    setNotifications(updated);
    setShowNotifications(false);
  };

  const filteredZones = zones || [];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter Modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SẮP XẾP THEO</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={22} color={theme.colors.textSecondary} />
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
                  <Check size={18} color={theme.colors.primary} />
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

    const getPlatformIcon = (platform: string) => {
      switch (platform) {
        case 'PC': return <Monitor size={10} color="#FFFFFF" />;
        case 'CONSOLE': return <Gamepad size={10} color="#FFFFFF" />;
        case 'MOBILE': return <Smartphone size={10} color="#FFFFFF" />;
        default: return null;
      }
    };

    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCardContainer}
        onPress={() =>
          navigation.navigate('TeamZoneVNs', {
            gameId: game.id,
            gameName: game.name,
          })
        }
        activeOpacity={0.8}
      >
        <View style={[styles.gameCardImageContainer, { shadowColor: accentColor }]}>
          <Image source={{ uri: game.iconUrl }} style={styles.gameCardImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.gameCardOverlay}
          />
          {/* Top highlight line */}
          <View style={[styles.gameCardTopLine, { backgroundColor: accentColor }]} />
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN': return { color: '#22C55E', label: 'OPEN', bg: 'rgba(34,197,94,0.15)' };
      case 'FULL': return { color: '#EF4444', label: 'FULL', bg: 'rgba(239,68,68,0.15)' };
      case 'STARTING': return { color: '#F59E0B', label: 'STARTING', bg: 'rgba(245,158,11,0.15)' };
      default: return { color: '#64748B', label: 'CLOSED', bg: 'rgba(100,116,139,0.15)' };
    }
  };

  const renderZoneItem = ({ item }: { item: Zone }) => {
    const hasMic = item.tags?.some(t => t.tag?.name?.toLowerCase().includes('mic')) ?? false;
    const statusCfg = getStatusConfig(item.status);

    // Player progress
    const approvedCount = item._count?.joinRequests ?? 0;
    const currentPlayers = approvedCount + 1;
    const maxPlayers = item.requiredPlayers;
    const progress = Math.min(currentPlayers / (maxPlayers || 1), 1);

    return (
      <TouchableOpacity
        style={styles.zoneCard}
        onPress={() => navigation.navigate('ZoneDetails', { zoneId: item.id })}
        activeOpacity={0.88}
      >
        {/* Top colored accent line */}
        <LinearGradient
          colors={['#2563FF', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.zoneCardTopLine}
        />

        <View style={styles.zoneContent}>
          {/* Row 1: Game tag + Status Badge */}
          <View style={styles.zoneTopRow}>
            <Text style={styles.zoneGameTag}>{item.game?.name || 'GAME'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Row 2: Title + Avatar */}
          <View style={styles.zoneMiddleRow}>
            <View style={styles.zoneTitleArea}>
              <Text style={styles.zoneTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.zoneHostRow}>
                <View style={styles.hostAvatar}>
                  {item.owner.avatarUrl ? (
                    <Image source={{ uri: item.owner.avatarUrl }} style={styles.hostAvatarImg} />
                  ) : (
                    <Text style={styles.hostAvatarText}>
                      {item.owner.username.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.hostName} numberOfLines={1}>{item.owner.username}</Text>
                <View style={styles.dotSep} />
                <Clock size={11} color={theme.colors.textMuted} />
                <Text style={styles.zoneTime}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Row 3: Tags */}
          <View style={styles.tagsRow}>
            {hasMic && (
              <View style={styles.tagPill}>
                <Mic size={10} color="#2563FF" />
                <Text style={[styles.tagPillText, { color: '#2563FF' }]}>VOICE ON</Text>
              </View>
            )}
            {item.tags
              ?.filter(t => !t.tag?.name?.toLowerCase().includes('mic'))
              .slice(0, 3)
              .map(t => (
                <View key={t.tag.id} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{t.tag.name}</Text>
                </View>
              ))}
            <View style={[styles.tagPill, { backgroundColor: 'rgba(37,99,255,0.12)' }]}>
              <Text style={[styles.tagPillText, { color: '#94A3B8' }]}>
                {getRankDisplay(item.minRankLevel)}
              </Text>
            </View>
          </View>

          {/* Row 4: Player progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Users size={12} color={theme.colors.textMuted} />
              <Text style={styles.progressText}>
                <Text style={styles.progressCurrent}>{currentPlayers}</Text>
                <Text style={styles.progressMuted}>/{maxPlayers} players</Text>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Categories */}
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

        {/* Popular Games */}
        <View style={styles.gamesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TRÒ CHƠI PHỔ BIẾN</Text>
            <TouchableOpacity onPress={() => tabNavigation.navigate('Discover')}>
              <Text style={styles.seeAllButton}>Xem tất cả →</Text>
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

        {/* Zones Section Title */}
        <View style={styles.zonesSectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Zap size={18} color="#F59E0B" fill="#F59E0B" />
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

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
              ) : (
                <LinearGradient
                  colors={['#2563FF', '#7C3AED']}
                  style={[styles.userAvatar, styles.userAvatarPlaceholder]}
                >
                  <Text style={styles.userAvatarText}>
                    {user?.username?.charAt(0).toUpperCase() || 'G'}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerTitle}>TEAMZONEVN</Text>
              <Text style={styles.headerSubtitle}>LOBBY</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Bell color={theme.colors.textSecondary} size={20} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.simpleSearchContainer}>
            <Search size={18} color={theme.colors.textMuted} />
            <TextInput
              style={styles.simpleSearchInput}
              placeholder="Tìm kiếm zone, game..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, sortBy !== 'newest' && styles.filterButtonActive]}
            onPress={handleFilterPress}
          >
            <Filter size={18} color={sortBy !== 'newest' ? theme.colors.primary : theme.colors.textSecondary} />
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
              <Zap size={48} color={theme.colors.primary} style={{ opacity: 0.4 }} />
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
  // Fixed Header
  fixedHeader: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContainer: {
    paddingBottom: theme.spacing.sm,
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
    position: 'relative',
    width: 42,
    height: 42,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(37,99,255,0.5)',
  },
  userAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    borderWidth: 2,
    borderColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  simpleSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  simpleSearchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    height: '100%',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: 'rgba(37,99,255,0.4)',
    backgroundColor: 'rgba(37,99,255,0.1)',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.primary,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(37,99,255,0.12)',
  },
  sortOptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },

  // Categories
  categoriesSection: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllButton: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  gamesScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 14,
  },
  gamesLoadingPlaceholder: {
    width: 120,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },

  // Game Card
  gameCardContainer: {
    width: GAME_CARD_WIDTH,
    gap: 8,
  },
  gameCardImageContainer: {
    width: GAME_CARD_WIDTH,
    height: GAME_CARD_WIDTH * 1.33,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    height: '60%',
  },
  gameCardTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gameCardBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  gameCardCount: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Zones Section
  zonesSectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: 100,
  },

  // Zone Card - New Gaming Dashboard Style
  zoneCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  zoneCardTopLine: {
    height: 2,
    width: '100%',
  },
  zoneContent: {
    padding: 16,
    gap: 12,
  },
  zoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneGameTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zoneMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneTitleArea: {
    flex: 1,
    gap: 6,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  zoneHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hostAvatarImg: {
    width: '100%',
    height: '100%',
  },
  hostAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  hostName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    maxWidth: 80,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
  },
  zoneTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Progress section
  progressSection: {
    gap: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 12,
  },
  progressCurrent: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  progressMuted: {
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty State
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyButton: {
    width: '100%',
  },
});
