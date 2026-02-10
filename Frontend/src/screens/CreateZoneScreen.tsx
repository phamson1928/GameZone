import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react-native';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { Game, RankLevel } from '../types';
import { RootStackParamList } from '../navigation';
import { RANK_LEVELS, getRankColor, getRankDisplay } from '../utils/rank';

type CreateZoneRouteProp = RouteProp<RootStackParamList, 'CreateZone'>;

const AVAILABLE_TAGS = [
  'Có Mic',
  'Leo Rank',
  'Vui Vẻ',
  'Tryhard',
  'Người Mới',
  'Tìm Bạn',
  'Chill',
  'Custom',
];

export const CreateZoneScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateZoneRouteProp>();
  const queryClient = useQueryClient();
  const initialGameId = route.params?.gameId ?? null;

  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minRank, setMinRank] = useState<RankLevel>('BEGINNER');
  const [maxRank, setMaxRank] = useState<RankLevel>('PRO');
  const [requiredPlayers, setRequiredPlayers] = useState(2);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= 3) {
        Alert.alert('Giới hạn', 'Chỉ được chọn tối đa 3 thẻ');
        return prev;
      }
      return [...prev, tag];
    });
  };

  const incrementPlayers = () => {
    if (requiredPlayers < 10) setRequiredPlayers(requiredPlayers + 1);
  };

  const decrementPlayers = () => {
    if (requiredPlayers > 1) setRequiredPlayers(requiredPlayers - 1);
  };

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await apiClient.get('/games/mobile');
      return response.data.data as Game[];
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: {
      gameId: string;
      title: string;
      description: string;
      minRankLevel: RankLevel;
      maxRankLevel: RankLevel;
      requiredPlayers: number;
      tags: string[];
    }) => {
      const response = await apiClient.post('/zones', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['myZones'] });
      Alert.alert('Thành công', 'Đã tạo phòng thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể tạo phòng';
      Alert.alert('Lỗi', Array.isArray(message) ? message[0] : message);
    },
  });

  const handleSubmit = () => {
    if (!selectedGameId) {
      Alert.alert('Lỗi', 'Vui lòng chọn game');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả');
      return;
    }

    const players = requiredPlayers;
    if (players < 1 || players > 10) {
      Alert.alert('Lỗi', 'Số người cần từ 1-10');
      return;
    }

    createZoneMutation.mutate({
      gameId: selectedGameId,
      title: title.trim(),
      description: description.trim(),
      minRankLevel: minRank,
      maxRankLevel: maxRank,
      requiredPlayers: players,
      tags: selectedTags,
    });
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TẠO PHÒNG MỚI</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Game Selection */}
        <Text style={styles.sectionTitle}>CHỌN GAME</Text>
        {gamesLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gamesScroll}
            contentContainerStyle={styles.gamesContent}
          >
            {games?.map(game => (
              <TouchableOpacity
                key={game.id}
                style={[
                  styles.gameCard,
                  selectedGameId === game.id && styles.gameCardSelected,
                ]}
                onPress={() => setSelectedGameId(game.id)}
              >
                <Image source={{ uri: game.iconUrl }} style={styles.gameIcon} />
                <Text style={styles.gameName} numberOfLines={1}>
                  {game.name}
                </Text>
                {selectedGameId === game.id && (
                  <View style={styles.checkIcon}>
                    <Check color="#FFFFFF" size={14} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Title */}
        <Text style={styles.label}>TIÊU ĐỀ</Text>
        <Input
          placeholder="VD: Tìm đồng đội rank Vàng"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>MÔ TẢ</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Mô tả chi tiết về phòng của bạn..."
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        {/* Rank Selection */}
        <Text style={styles.sectionTitle}>YÊU CẦU RANK</Text>
        
        {/* Tags Selection */}
        <Text style={styles.label}>THẺ (TAGS)</Text>
        <View style={styles.tagsContainer}>
          {AVAILABLE_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  isSelected && styles.tagChipSelected,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>RANK TỐI THIỂU</Text>
        <View style={styles.rankRow}>
          {RANK_LEVELS.map(rank => {
            const isSelected = minRank === rank;
            const color = getRankColor(rank);
            return (
              <TouchableOpacity
                key={`min-${rank}`}
                style={[
                  styles.rankOption,
                  isSelected
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: theme.colors.border },
                ]}
                onPress={() => setMinRank(rank)}
              >
                <Text
                  style={[
                    styles.rankOptionText,
                    { color: isSelected ? '#FFFFFF' : theme.colors.text },
                    isSelected && { fontWeight: 'bold' },
                  ]}
                >
                  {getRankDisplay(rank)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>RANK TỐI ĐA</Text>
        <View style={styles.rankRow}>
          {RANK_LEVELS.map(rank => {
            const isSelected = maxRank === rank;
            const color = getRankColor(rank);
            return (
              <TouchableOpacity
                key={`max-${rank}`}
                style={[
                  styles.rankOption,
                  isSelected
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: theme.colors.border },
                ]}
                onPress={() => setMaxRank(rank)}
              >
                <Text
                  style={[
                    styles.rankOptionText,
                    { color: isSelected ? '#FFFFFF' : theme.colors.text },
                    isSelected && { fontWeight: 'bold' },
                  ]}
                >
                  {getRankDisplay(rank)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Required Players */}
        <Text style={styles.label}>SỐ NGƯỜI CẦN TÌM (1-10)</Text>
        <View style={styles.playerCountContainer}>
          <TouchableOpacity 
            style={[styles.playerCountButton, requiredPlayers <= 1 && styles.playerCountButtonDisabled]} 
            onPress={decrementPlayers}
            disabled={requiredPlayers <= 1}
          >
            <Minus size={20} color={requiredPlayers <= 1 ? theme.colors.textSecondary : theme.colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.playerCountDisplay}>
            <Text style={styles.playerCountText}>{requiredPlayers}</Text>
            <Text style={styles.playerCountLabel}>người</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.playerCountButton, requiredPlayers >= 10 && styles.playerCountButtonDisabled]} 
            onPress={incrementPlayers}
            disabled={requiredPlayers >= 10}
          >
            <Plus size={20} color={requiredPlayers >= 10 ? theme.colors.textSecondary : theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <Button
          title="TẠO PHÒNG"
          onPress={handleSubmit}
          loading={createZoneMutation.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gamesScroll: {
    marginBottom: theme.spacing.lg,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  gamesContent: {
    paddingRight: theme.spacing.lg,
  },
  gameCard: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '1A',
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  gameName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  rankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  rankOption: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  rankOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  playerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  playerCountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  playerCountButtonDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  playerCountDisplay: {
    alignItems: 'center',
    minWidth: 60,
  },
  playerCountText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  playerCountLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  submitButton: {
    marginTop: theme.spacing.xl,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
});
