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
  StatusBar,
  Platform,
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
  Gamepad2,
  Tag,
} from 'lucide-react-native';
import { apiClient } from '../api/client';
import { Game, RankLevel, Tag as TagType } from '../types';
import { RootStackParamList } from '../navigation';
import { RANK_LEVELS, getRankColor, getRankDisplay } from '../utils/rank';

type CreateZoneRouteProp = RouteProp<RootStackParamList, 'CreateZone'>;

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

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
      return response.data.data as TagType[];
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Floating back button — no heavy header bar */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ArrowLeft color="#94A3B8" size={20} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title inside scroll body */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Tạo phòng mới</Text>
          <Text style={styles.pageSubtitle}>Tìm đồng đội ngay</Text>
        </View>

        {/* ── Game Selection ── */}
        <SectionLabel icon={<Gamepad2 color="#2563FF" size={15} strokeWidth={2.5} />} title="Chọn game" />

        {gamesLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2563FF" />
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
                style={[styles.gameCard, selectedGameId === game.id && styles.gameCardSelected]}
                onPress={() => setSelectedGameId(game.id)}
                activeOpacity={0.75}
              >
                <View style={styles.gameImageWrap}>
                  <Image source={{ uri: game.iconUrl }} style={styles.gameIcon} />
                  {selectedGameId === game.id && (
                    <View style={styles.checkOverlay}>
                      <Check color="#FFF" size={12} strokeWidth={3} />
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

        {/* ── Title ── */}
        <SectionLabel title="Tiêu đề phòng" required />
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="VD: Tìm đồng đội rank Vàng"
            placeholderTextColor="#475569"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* ── Description ── */}
        <SectionLabel title="Mô tả chi tiết" required />
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết về phòng của bạn..."
            placeholderTextColor="#475569"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={[styles.charCount, styles.charCountArea]}>{description.length}/500</Text>
        </View>

        {/* ── Tags ── */}
        <SectionLabel
          icon={<Tag color="#2563FF" size={15} strokeWidth={2.5} />}
          title="Tags"
          sub="tối đa 3"
        />
        <View style={styles.tagsWrap}>
          {tagsLoading ? (
            <ActivityIndicator color="#2563FF" />
          ) : (
            tags?.map(tag => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  onPress={() => toggleTag(tag.id)}
                  activeOpacity={0.75}
                >
                  {selected && <Check color="#2563FF" size={12} strokeWidth={3} />}
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Rank ── */}
        <SectionLabel icon={<Trophy color="#2563FF" size={15} strokeWidth={2.5} />} title="Yêu cầu rank" />
        <View style={styles.rankBox}>
          <Text style={styles.rankLabel}>Tối thiểu</Text>
          <View style={styles.rankRow}>
            {RANK_LEVELS.map(rank => {
              const sel = minRank === rank;
              return (
                <TouchableOpacity
                  key={`min-${rank}`}
                  style={[styles.rankBtn, sel && { backgroundColor: getRankColor(rank), borderColor: getRankColor(rank) }]}
                  onPress={() => setMinRank(rank)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.rankBtnText, sel && styles.rankBtnTextSel]}>
                    {getRankDisplay(rank)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <Text style={styles.rankLabel}>Tối đa</Text>
          <View style={styles.rankRow}>
            {RANK_LEVELS.map(rank => {
              const sel = maxRank === rank;
              return (
                <TouchableOpacity
                  key={`max-${rank}`}
                  style={[styles.rankBtn, sel && { backgroundColor: getRankColor(rank), borderColor: getRankColor(rank) }]}
                  onPress={() => setMaxRank(rank)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.rankBtnText, sel && styles.rankBtnTextSel]}>
                    {getRankDisplay(rank)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Players ── */}
        <SectionLabel icon={<Users color="#2563FF" size={15} strokeWidth={2.5} />} title="Số người cần tìm" />
        <View style={styles.playerRow}>
          <TouchableOpacity
            style={[styles.playerBtn, requiredPlayers <= 1 && styles.playerBtnDisabled]}
            onPress={decrementPlayers}
            disabled={requiredPlayers <= 1}
            activeOpacity={0.7}
          >
            <Minus size={20} color={requiredPlayers <= 1 ? '#334155' : '#2563FF'} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.playerValueWrap}>
            <Text style={styles.playerValue}>{requiredPlayers}</Text>
            <Text style={styles.playerUnit}>người chơi</Text>
          </View>
          <TouchableOpacity
            style={[styles.playerBtn, requiredPlayers >= 10 && styles.playerBtnDisabled]}
            onPress={incrementPlayers}
            disabled={requiredPlayers >= 10}
            activeOpacity={0.7}
          >
            <Plus size={20} color={requiredPlayers >= 10 ? '#334155' : '#2563FF'} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, createZoneMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={createZoneMutation.isPending}
          activeOpacity={0.85}
        >
          {createZoneMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Sparkles color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text style={styles.submitText}>Tạo phòng ngay</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

/* ─── tiny helper so JSX above stays clean ─── */
interface SectionLabelProps {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  required?: boolean;
}
const SectionLabel = ({ icon, title, sub, required }: SectionLabelProps) => (
  <View style={styles.sectionLabel}>
    {icon}
    <Text style={styles.sectionLabelText}>{title}</Text>
    {required && <Text style={styles.required}>*</Text>}
    {sub && <Text style={styles.sectionSub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  /* ─── floating back button ─── */
  backButton: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + 10,
    left: 18,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,41,59,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── scroll body ─── */
  content: {
    paddingTop: STATUSBAR_HEIGHT + 64,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* ─── page title block ─── */
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginTop: 4,
  },

  /* ─── section label ─── */
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  required: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700',
    lineHeight: 16,
  },
  sectionSub: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    marginLeft: 2,
  },

  /* ─── loading ─── */
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 20,
  },

  /* ─── games ─── */
  gamesScroll: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  gamesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  gameCard: {
    width: 96,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gameCardSelected: {
    borderColor: '#2563FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(37,99,255,0.1)',
  },
  gameImageWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  gameIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  checkOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  gameName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
  },

  /* ─── text inputs ─── */
  inputWrap: {
    position: 'relative',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    paddingRight: 52,
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  charCount: {
    position: 'absolute',
    right: 12,
    top: 13,
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
  charCountArea: {
    top: 'auto',
    bottom: 10,
  },

  /* ─── tags ─── */
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagChipSelected: {
    backgroundColor: 'rgba(37,99,255,0.12)',
    borderColor: 'rgba(37,99,255,0.6)',
  },
  tagText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#2563FF',
  },

  /* ─── rank ─── */
  rankBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rankBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rankBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  rankBtnTextSel: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 14,
  },

  /* ─── players counter ─── */
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 28,
  },
  playerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  playerValueWrap: {
    alignItems: 'center',
  },
  playerValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#2563FF',
    letterSpacing: -2,
    lineHeight: 48,
  },
  playerUnit: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* ─── submit ─── */
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563FF',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
