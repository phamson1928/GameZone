import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform as RNPlatform,
  Dimensions,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Monitor, Smartphone, Gamepad, Sparkles } from 'lucide-react-native';
import { Container } from '../components/Container';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { Game, Platform } from '../types';
import { RootStackParamList } from '../navigation';
import { STRINGS } from '../constants/strings';

const { width } = Dimensions.get('window');
const CARD_MARGIN = theme.spacing.md;
const CARD_WIDTH = (width - theme.spacing.lg * 2 - CARD_MARGIN) / 2;

const FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'ALL', icon: Sparkles },
  { label: 'PC', value: 'PC', icon: Monitor },
  { label: 'Console', value: 'CONSOLE', icon: Gamepad },
  { label: 'Mobile', value: 'MOBILE', icon: Smartphone },
];

export const DiscoverScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  const { data: games, isLoading, refetch } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await apiClient.get('/games/mobile');
      return response.data.data as Game[];
    },
  });

  // Filter games by platform (frontend filtering)
  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (selectedPlatform === 'ALL') return games;

    return games.filter(game =>
      game.platforms?.includes(selectedPlatform as Platform)
    );
  }, [games, selectedPlatform]);

  const renderGameItem = ({ item }: { item: Game }) => {
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
        style={styles.cardContainer}
        onPress={() =>
          navigation.navigate('TeamZoneVNs', {
            gameId: item.id,
            gameName: item.name,
          })
        }
        activeOpacity={0.9}
      >
        <View style={styles.posterCard}>
          <Image source={{ uri: item.bannerUrl }} style={styles.posterImage} contentFit="cover" transition={500} cachePolicy="disk" />
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.badgeContainer}>
            {item.platforms && item.platforms.length > 0 ? (
              <View style={styles.platformBadges}>
                {item.platforms.slice(0, 3).map((platform, idx) => (
                  <View key={idx} style={styles.platformBadge}>
                    {getPlatformIcon(platform)}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.genreBadge}>
                <Text style={styles.genreText}>GAME</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.zoneCount}>
            {item._count?.zones || 0} {STRINGS.ACTIVE_ZONES_COUNT}
          </Text>
        </View>
      </TouchableOpacity>
    );
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

  return (
    <Container>
      <FlatList
        ListHeaderComponent={
          <View>
            {/* Title Section */}
            <View style={styles.header}>
              <Text style={styles.title}>{STRINGS.DISCOVER_TITLE}</Text>
              <Text style={styles.subtitle}>{STRINGS.DISCOVER_SUBTITLE}</Text>
            </View>

            {/* Platform Filter */}
            <View style={styles.filterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
                keyboardShouldPersistTaps="handled"
              >
                {FILTER_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = selectedPlatform === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedPlatform(option.value)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        size={16}
                        color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                      <Text style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Results count */}
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
                </Text>
              </View>
            </View>
          </View>
        }
        data={filteredGames}
        renderItem={renderGameItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        numColumns={2}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
    fontWeight: '500',
  },
  // Filter Section
  filterSection: {
    paddingBottom: theme.spacing.md,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultsInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  resultsText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: theme.spacing.lg,
  },
  posterCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 2,
  },
  genreBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  platformBadge: {
    width: 22,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardInfo: {
    marginTop: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  zoneCount: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

