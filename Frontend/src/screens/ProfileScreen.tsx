import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Gamepad2, Users, Star, Trophy, MapPin, Calendar, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Container } from '../components/Container';
import { useAuthStore } from '../store/useAuthStore';
import { theme, getBorderColorById } from '../theme';
import { Button } from '../components/Button';
import { STRINGS } from '../constants/strings';
import { apiClient } from '../api/client';
import { UserGameProfile, RankLevel } from '../types';
import { RANK_COLORS, getRankDisplay } from '../utils/rank';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: gameProfiles, isLoading } = useQuery({
    queryKey: ['user-game-profiles'],
    queryFn: async () => {
      const response = await apiClient.get('/user-game-profiles/me');
      return response.data.data;
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/user-game-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-game-profiles'] });
      Alert.alert('Thành công', 'Đã xóa hồ sơ game');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xóa hồ sơ game');
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa hồ sơ game này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          onPress: () => deleteProfileMutation.mutate(id) 
        },
      ]
    );
  };

  return (
    <Container>
      {/* Top Bar - Consistent with HomeScreen */}
      <View style={styles.topBar}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>HỒ SƠ CỦA TÔI</Text>
          <Text style={styles.headerSubtitle}>THÔNG TIN CÁ NHÂN</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <Settings size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card - Main Info */}
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.statusBadge} />
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user?.username}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'ADMIN' ? STRINGS.ROLE_ADMIN : STRINGS.ROLE_USER}
              </Text>
              <View style={styles.playStyleBadge}>
                <Gamepad2 size={12} color={theme.colors.primary} />
                <Text style={styles.playStyleText}>
                  {user?.profile?.playStyle || STRINGS.PLAYSTYLE_CASUAL}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.bioText}>
            {user?.profile?.bio || STRINGS.BIO_PLACEHOLDER}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Trophy size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{gameProfiles?.length || 0}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
              <Users size={20} color={theme.colors.accent} />
            </View>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Bạn bè</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
              <Star size={20} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Game Profiles Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Gamepad2 size={20} color={theme.colors.accent} />
            <Text style={styles.sectionTitle}>GAME ĐÃ CHƠI</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddGameProfile' as never)}
          >
            <Text style={styles.seeAllButton}>+ Thêm Game</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : gameProfiles?.length > 0 ? (
          gameProfiles.map((profile: UserGameProfile) => {
            const borderColor = getBorderColorById(profile.id);
            return (
              <View key={profile.id} style={styles.gameProfileCard}>
                {/* Removed accentBar */}
                <Image 
                  source={{ uri: profile.game.iconUrl }} 
                  style={styles.gameProfileIcon} 
                />
                <View style={styles.gameProfileInfo}>
                  <Text style={styles.gameProfileName}>{profile.game.name}</Text>
                  <View style={[
                    styles.rankPill, 
                    { backgroundColor: RANK_COLORS[profile.rankLevel] + '20' } // lighter bg
                  ]}>
                    <Text style={[styles.rankPillText, { color: RANK_COLORS[profile.rankLevel] }]}>
                      {getRankDisplay(profile.rankLevel)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => handleDelete(profile.id)}
                  style={styles.actionButton}
                >
                  <Trash2 size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{STRINGS.NO_RANKS}</Text>
            <Button 
              title="Thêm Game Ngay" 
              onPress={() => navigation.navigate('AddGameProfile' as never)}
              size="sm"
              variant="outline"
            />
          </View>
        )}

        <View style={styles.footerActions}>
          <Button 
            title="My Zones"
            onPress={() => navigation.navigate('MyZones' as never)} 
            variant="primary" 
            style={styles.footerButton}
            icon={<MapPin size={18} color="#FFF" />}
          />
          <Button 
            title={STRINGS.LOGOUT}
            onPress={logout} 
            variant="outline" 
            style={styles.footerButton}
          />
        </View>
      </ScrollView>
    </Container>
  );
};


const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: theme.spacing.xl,
    // Soft shadow, neutral color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarInitial: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  playStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playStyleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  bioText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  
  // Games Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllButton: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  gameProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    // Soft shadow instead of border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  gameProfileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: theme.colors.surfaceLight,
  },
  gameProfileInfo: {
    flex: 1,
    gap: 4,
  },
  gameProfileName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rankPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionButton: {
    padding: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  footerActions: {
    gap: 12,
    marginTop: theme.spacing.lg,
  },
  footerButton: {
    width: '100%',
  },
});
