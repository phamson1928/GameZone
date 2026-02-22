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
import {
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Sparkles,
  Users,
  Trophy,
} from 'lucide-react-native';
import { apiClient } from '../api/client';
import { Game, RankLevel, Tag } from '../types';
import { RootStackParamList } from '../navigation';
import { RANK_LEVELS, getRankColor, getRankDisplay } from '../utils/rank';

type CreateZoneRouteProp = RouteProp<RootStackParamList, 'CreateZone'>;

export const CreateZoneScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateZoneRouteProp>();
  const queryClient = useQueryClient();
  const initialGameId = route.params?.gameId ?? null;

  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    initialGameId,
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minRank, setMinRank] = useState<RankLevel>('BEGINNER');
  const [maxRank, setMaxRank] = useState<RankLevel>('PRO');
  const [requiredPlayers, setRequiredPlayers] = useState(2);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) return prev.filter(t => t !== tagId);
      if (prev.length >= 3) {
        Alert.alert('Giới hạn', 'Chỉ được chọn tối đa 3 thẻ');
        return prev;
      }
      return [...prev, tagId];
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

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.get('/tags');
      return response.data.data as Tag[];
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
      tagIds: string[];
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
      tagIds: selectedTagIds,
    });
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Sparkles color="#FFFFFF" size={20} />
            <Text style={styles.headerTitle}>Tạo Phòng Mới</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Game Selection with Modern Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>🎮</Text>
            </View>
            <Text style={styles.sectionTitle}>Chọn Game</Text>
          </View>

          {gamesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#2563FF" size="large" />
            </View>
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
                  activeOpacity={0.7}
                >
                  <View style={styles.gameImageContainer}>
                    <Image
                      source={{ uri: game.iconUrl }}
                      style={styles.gameIcon}
                    />
                    {selectedGameId === game.id && (
                      <View style={styles.checkIconOverlay}>
                        <Check color="#FFFFFF" size={20} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.gameName} numberOfLines={2}>
                    {game.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Tiêu đề phòng</Text>
            <Text style={styles.labelRequired}>*</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="VD: Tìm đồng đội rank Vàng"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Mô tả chi tiết</Text>
            <Text style={styles.labelRequired}>*</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết về phòng của bạn..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Tags Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>🏷️</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Thẻ tags</Text>
              <Text style={styles.sectionSubtitle}>Chọn tối đa 3 thẻ</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {tagsLoading ? (
              <ActivityIndicator color="#2563FF" />
            ) : (
              tags?.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                    ]}
                    onPress={() => toggleTag(tag.id)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Check color="#FFFFFF" size={14} strokeWidth={2.5} />
                    )}
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Rank Selection with Modern Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Trophy color="#2563FF" size={18} />
            </View>
            <Text style={styles.sectionTitle}>Yêu cầu Rank</Text>
          </View>

          <View style={styles.rankContainer}>
            <View style={styles.rankSection}>
              <Text style={styles.rankLabel}>Rank tối thiểu</Text>
              <View style={styles.rankGrid}>
                {RANK_LEVELS.map(rank => {
                  const isSelected = minRank === rank;
                  const color = getRankColor(rank);
                  return (
                    <TouchableOpacity
                      key={`min-${rank}`}
                      style={[
                        styles.rankButton,
                        isSelected && {
                          backgroundColor: color,
                          borderColor: color,
                          transform: [{ scale: 1.05 }],
                        },
                      ]}
                      onPress={() => setMinRank(rank)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.rankButtonText,
                          isSelected && styles.rankButtonTextSelected,
                        ]}
                      >
                        {getRankDisplay(rank)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.rankDivider} />

            <View style={styles.rankSection}>
              <Text style={styles.rankLabel}>Rank tối đa</Text>
              <View style={styles.rankGrid}>
                {RANK_LEVELS.map(rank => {
                  const isSelected = maxRank === rank;
                  const color = getRankColor(rank);
                  return (
                    <TouchableOpacity
                      key={`max-${rank}`}
                      style={[
                        styles.rankButton,
                        isSelected && {
                          backgroundColor: color,
                          borderColor: color,
                          transform: [{ scale: 1.05 }],
                        },
                      ]}
                      onPress={() => setMaxRank(rank)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.rankButtonText,
                          isSelected && styles.rankButtonTextSelected,
                        ]}
                      >
                        {getRankDisplay(rank)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Required Players with Modern Counter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Users color="#2563FF" size={18} />
            </View>
            <Text style={styles.sectionTitle}>Số người cần tìm</Text>
          </View>

          <View style={styles.playerCard}>
            <TouchableOpacity
              style={[
                styles.playerButton,
                requiredPlayers <= 1 && styles.playerButtonDisabled,
              ]}
              onPress={decrementPlayers}
              disabled={requiredPlayers <= 1}
              activeOpacity={0.7}
            >
              <View style={styles.playerButtonInner}>
                <Minus
                  size={24}
                  color={requiredPlayers <= 1 ? '#334155' : '#2563FF'}
                  strokeWidth={2.5}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.playerDisplay}>
              <Text style={styles.playerNumber}>{requiredPlayers}</Text>
              <Text style={styles.playerLabel}>người chơi</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.playerButton,
                requiredPlayers >= 10 && styles.playerButtonDisabled,
              ]}
              onPress={incrementPlayers}
              disabled={requiredPlayers >= 10}
              activeOpacity={0.7}
            >
              <View style={styles.playerButtonInner}>
                <Plus
                  size={24}
                  color={requiredPlayers >= 10 ? '#334155' : '#2563FF'}
                  strokeWidth={2.5}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button with Modern Design */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            createZoneMutation.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={createZoneMutation.isPending}
          activeOpacity={0.8}
        >
          {createZoneMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Sparkles color="#FFFFFF" size={20} />
              <Text style={styles.submitButtonText}>Tạo Phòng Ngay</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerContainer: {
    position: 'relative',
    paddingTop: 12,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  gamesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  gamesContent: {
    paddingRight: 20,
    gap: 12,
  },
  gameCard: {
    width: 110,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardSelected: {
    borderColor: '#2563FF',
    borderWidth: 2,
    backgroundColor: 'rgba(37,99,255,0.12)',
    shadowColor: '#2563FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  gameImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  checkIconOverlay: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  gameName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 17,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelRequired: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '700',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    paddingRight: 60,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  charCount: {
    position: 'absolute',
    right: 14,
    top: 14,
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  tagChipSelected: {
    backgroundColor: 'rgba(37,99,255,0.2)',
    borderColor: '#2563FF',
    borderWidth: 1.5,
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tagText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tagTextSelected: {
    color: '#2563FF',
  },
  rankContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  rankSection: {
    marginBottom: 20,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rankButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  rankButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  rankDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  playerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37,99,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.25)',
  },
  playerButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  playerButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerDisplay: {
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#2563FF',
    letterSpacing: -2,
  },
  playerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563FF',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomSpacer: {
    height: 60,
  },
});
