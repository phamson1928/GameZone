import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '../components/Container';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { Game } from '../types';
import { RootStackParamList } from '../navigation';
import { STRINGS } from '../constants/strings';

const { width } = Dimensions.get('window');
const CARD_MARGIN = theme.spacing.md;
const CARD_WIDTH = (width - theme.spacing.lg * 2 - CARD_MARGIN) / 2;

export const DiscoverScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await apiClient.get('/games/mobile');
      return response.data.data as Game[];
    },
  });

  const getGenre = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fps') || lower.includes('duty') || lower.includes('shoot')) return 'FPS';
    if (lower.includes('rpg') || lower.includes('impact')) return 'RPG';
    if (lower.includes('moba') || lower.includes('legend')) return 'MOBA';
    if (lower.includes('racing') || lower.includes('speed')) return 'RACING';
    return 'ACTION';
  };

  const renderGameItem = ({ item }: { item: Game }) => {
    const genre = getGenre(item.name);
    
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
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
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
          <View style={styles.header}>
            <Text style={styles.title}>{STRINGS.DISCOVER_TITLE}</Text>
            <Text style={styles.subtitle}>{STRINGS.DISCOVER_SUBTITLE}</Text>
          </View>
        }
        data={data}
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
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

