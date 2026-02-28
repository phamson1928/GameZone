import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Gamepad2, Users, Star, Trophy, MapPin, Settings, LogOut, Zap } from 'lucide-react-native';
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
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa hồ sơ game này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteProfileMutation.mutate(id) },
    ]);
  };

  return (
    <Container>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>HỒ SƠ</Text>
          <Text style={styles.headerSubtitle}>THÔNG TIN CÁ NHÂN</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <Settings size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(37,99,255,0.15)', 'rgba(124,58,237,0.08)']}
            style={styles.heroCardBg}
          />

          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar}  contentFit="cover" transition={500} cachePolicy="disk"/>
              ) : (
                <LinearGradient colors={['#2563FF', '#7C3AED']} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username}>{user?.username}</Text>
              <View style={styles.roleBadge}>
                <Zap size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.roleText}>
                  {user?.role === 'ADMIN' ? STRINGS.ROLE_ADMIN : STRINGS.ROLE_USER}
                </Text>
              </View>
              <View style={styles.playStyleBadge}>
                <Gamepad2 size={12} color={theme.colors.primary} />
                <Text style={styles.playStyleText}>
                  {user?.profile?.playStyle || STRINGS.PLAYSTYLE_CASUAL}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bioDivider} />
          <Text style={styles.bioText}>
            {user?.profile?.bio || STRINGS.BIO_PLACEHOLDER}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: Trophy, color: theme.colors.primary, value: gameProfiles?.length || 0, label: 'Games' },
            { icon: Users, color: '#22C55E', value: 142, label: 'Bạn bè' },
            { icon: Star, color: '#F59E0B', value: '4.9', label: 'Rating' },
          ].map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <LinearGradient
                colors={[stat.color + '20', stat.color + '05']}
                style={styles.statIconBg}
              >
                <stat.icon size={20} color={stat.color} />
              </LinearGradient>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Game Profiles Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Gamepad2 size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>GAME ĐÃ CHƠI</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AddGameProfile' as never)}>
            <Text style={styles.addButton}>+ Thêm Game</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
        ) : gameProfiles?.length > 0 ? (
          gameProfiles.map((profile: UserGameProfile) => {
            const borderColor = getBorderColorById(profile.id);
            return (
              <View key={profile.id} style={styles.gameProfileCard}>
                <View style={[styles.gameCardAccent, { backgroundColor: borderColor }]} />
                <Image
                  source={{ uri: profile.game.iconUrl }}
                  style={styles.gameProfileIcon}
                 contentFit="cover" transition={500} cachePolicy="disk"/>
                <View style={styles.gameProfileInfo}>
                  <Text style={styles.gameProfileName}>{profile.game.name}</Text>
                  <View style={[styles.rankPill, { backgroundColor: (RANK_COLORS[profile.rankLevel] || borderColor) + '20' }]}>
                    <Text style={[styles.rankPillText, { color: RANK_COLORS[profile.rankLevel] || borderColor }]}>
                      {getRankDisplay(profile.rankLevel)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(profile.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Gamepad2 size={40} color={theme.colors.primary} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>{STRINGS.NO_RANKS}</Text>
            <Button
              title="Thêm Game Ngay"
              onPress={() => navigation.navigate('AddGameProfile' as never)}
              size="sm"
              variant="outline"
            />
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.myZonesButton}
            onPress={() => navigation.navigate('MyZones' as never)}
          >
            <LinearGradient colors={['#2563FF', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.myZonesGradient}>
              <MapPin size={16} color="#FFF" />
              <Text style={styles.myZonesText}>My Zones</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <LogOut size={16} color={theme.colors.error} />
            <Text style={styles.logoutText}>{STRINGS.LOGOUT}</Text>
          </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(37,99,255,0.5)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(37,99,255,0.4)',
  },
  avatarInitial: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '900',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37,99,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37,99,255,0.2)',
  },
  playStyleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bioDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  addButton: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Game Profile Card
  gameProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  gameCardAccent: {
    width: 3,
    height: '100%',
    alignSelf: 'stretch',
  },
  gameProfileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    margin: 12,
  },
  gameProfileInfo: {
    flex: 1,
    gap: 5,
    paddingRight: 8,
  },
  gameProfileName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rankPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 14,
    margin: 2,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
    marginBottom: theme.spacing.lg,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Footer
  footerActions: {
    gap: 12,
    marginTop: 24,
  },
  myZonesButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  myZonesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  myZonesText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
