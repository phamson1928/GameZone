import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform as RNPlatform,
  Dimensions,
  ScrollView,
} from 'react-native';
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
          navigation.navigate('GameZones', {
            gameId: item.id,
            gameName: item.name,
          })
        }
        activeOpacity={0.9}
      >
        <View style={styles.posterCard}>
          <Image source={{ uri: item.bannerUrl }} style={styles.posterImage} resizeMode="cover" />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: RNPlatform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  resultsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)', // slate-200 equivalent with opacity
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
    borderRadius: 4,
  },
  platformBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  platformBadge: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardInfo: {
    marginTop: 8,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  zoneCount: {
    fontSize: 12,
    color: theme.colors.accent,
  },
});

