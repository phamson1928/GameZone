import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Users, Trophy, Clock, User, Shield, Gamepad2, Monitor, Smartphone, MessageCircle, Hash } from 'lucide-react-native';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import { Zone } from '../types';
import { RootStackParamList } from '../navigation';
import { getRankDisplay } from '../utils/rank';

type ZoneDetailsRouteProp = RouteProp<RootStackParamList, 'ZoneDetails'>;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return theme.colors.neonGreen;
    case 'FULL':
      return theme.colors.warning;
    case 'CLOSED':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
};

const PulseDot = ({ color }: { color: string }) => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            backgroundColor: color,
            transform: [{ scale: anim }],
            opacity: anim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [0.6, 0],
            }),
          },
        ]}
      />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
};

export const ZoneDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ZoneDetailsRouteProp>();
  const { zoneId } = route.params;

  const { data: zone, isLoading, error } = useQuery({
    queryKey: ['zone', zoneId],
    queryFn: async () => {
      const response = await apiClient.get(`/zones/${zoneId}`);
      return response.data.data as Zone;
    },
  });

  const handleRequestJoin = () => {
    Alert.alert(
      'Gửi yêu cầu',
      'Bạn muốn tham gia phòng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gửi yêu cầu', 
          onPress: () => Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia!') 
        },
      ]
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

  if (error || !zone) {
    return (
      <Container>
        <View style={styles.center}>
          <Text style={styles.errorText}>Không thể tải thông tin phòng</Text>
          <Button title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Sảnh chờ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(zone.status) + '40', backgroundColor: getStatusColor(zone.status) + '10' }]}>
            {zone.status === 'OPEN' ? (
              <PulseDot color={getStatusColor(zone.status)} />
            ) : (
              <View style={[styles.staticDot, { backgroundColor: getStatusColor(zone.status) }]} />
            )}
            <Text style={[styles.statusText, { color: getStatusColor(zone.status) }]}>
              {zone.status === 'OPEN' ? 'ĐANG TÌM NGƯỜI' : zone.status === 'FULL' ? 'ĐÃ ĐẦY' : 'ĐÃ ĐÓNG'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{zone.title}</Text>
        <Text style={styles.description}>{zone.description}</Text>

        {/* Game Info - Modern Card */}
        {zone.game && (
          <View style={styles.gameCard}>
            <View style={styles.gameIconContainer}>
              <Image source={{ uri: zone.game.iconUrl }} style={styles.gameIcon} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameLabel}>Game</Text>
              <Text style={styles.gameName}>{zone.game.name}</Text>
              {zone.game.platforms && zone.game.platforms.length > 0 && (
                <View style={styles.platformBadges}>
                  {zone.game.platforms.map((platform, idx) => (
                    <View key={idx} style={styles.platformBadge}>
                      {platform === 'PC' && <Monitor size={12} color={theme.colors.primary} />}
                      {platform === 'CONSOLE' && <Gamepad2 size={12} color={theme.colors.primary} />}
                      {platform === 'MOBILE' && <Smartphone size={12} color={theme.colors.primary} />}
                      <Text style={styles.platformText}>{platform}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Gamepad2 color={theme.colors.primary} size={24} style={{ opacity: 0.5 }} />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: theme.colors.accent }]}>
            <View style={styles.statIconBg}>
              <Users color={theme.colors.accent} size={20} />
            </View>
            <View>
              <Text style={styles.statValue}>{zone.requiredPlayers}</Text>
              <Text style={styles.statLabel}>Cần thêm</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: theme.colors.primary }]}>
            <View style={[styles.statIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
              <Trophy color={theme.colors.primary} size={20} />
            </View>
            <View>
              <Text style={styles.statValue}>
                {getRankDisplay(zone.minRankLevel)}
              </Text>
              <Text style={styles.statLabel}>Rank tối thiểu</Text>
            </View>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên</Text>
          <View style={styles.participantsContainer}>
            <View style={styles.avatarStack}>
              {/* Owner Avatar */}
              <View style={styles.participantAvatarWrapper}>
                {zone.owner.avatarUrl ? (
                  <Image source={{ uri: zone.owner.avatarUrl }} style={styles.participantAvatar} />
                ) : (
                  <View style={[styles.participantAvatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarLetter}>{zone.owner.username[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.ownerBadgeIcon}>
                  <Shield size={10} color="#FFF" fill={theme.colors.primary} />
                </View>
              </View>
              
              {/* Empty Slots */}
              {Array.from({ length: Math.min(zone.requiredPlayers, 3) }).map((_, i) => (
                <View key={i} style={[styles.participantAvatar, styles.emptySlot]}>
                   <User color={theme.colors.textSecondary} size={20} style={{ opacity: 0.5 }} />
                </View>
              ))}
              
              {zone.requiredPlayers > 3 && (
                <View style={[styles.participantAvatar, styles.moreSlots]}>
                  <Text style={styles.moreSlotsText}>+{zone.requiredPlayers - 3}</Text>
                </View>
              )}
            </View>
            <Text style={styles.slotCountText}>
              Còn trống <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{zone.requiredPlayers}</Text> slot
            </Text>
          </View>
        </View>

        {/* Tags */}
        {zone.tags && zone.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {zone.tags.map(tagRelation => (
              <View key={tagRelation.tag.id} style={styles.tag}>
                <Text style={styles.tagText}>#{tagRelation.tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contact Methods */}
        {zone.contacts && zone.contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liên hệ</Text>
            <View style={styles.contactsContainer}>
              {zone.contacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactIcon}>
                    {contact.type === 'DISCORD' && <MessageCircle size={16} color={theme.colors.primary} />}
                    {contact.type === 'INGAME' && <Gamepad2 size={16} color={theme.colors.primary} />}
                    {contact.type === 'OTHER' && <Hash size={16} color={theme.colors.primary} />}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactType}>
                      {contact.type === 'DISCORD' ? 'Discord' : contact.type === 'INGAME' ? 'In-Game' : 'Other'}
                    </Text>
                    <Text style={styles.contactValue}>{contact.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chủ phòng</Text>
          <View style={styles.ownerCard}>
            {zone.owner.avatarUrl ? (
              <Image source={{ uri: zone.owner.avatarUrl }} style={styles.ownerAvatar} />
            ) : (
              <View style={styles.ownerAvatarPlaceholder}>
                <User color={theme.colors.text} size={24} />
              </View>
            )}
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{zone.owner.username}</Text>
              <View style={styles.ownerMeta}>
                <Clock color={theme.colors.textSecondary} size={12} />
                <Text style={styles.ownerDate}>
                  Tham gia {new Date(zone.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Glass Footer */}
      {zone.status === 'OPEN' && (
        <View style={styles.footer}>
          <View style={styles.glassBackground} />
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRequestJoin}
            activeOpacity={0.9}
          >
            <Text style={styles.actionButtonText}>Gửi yêu cầu tham gia</Text>
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceLight,
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
  content: {
    padding: theme.spacing.lg,
  },
  statusContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  staticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  gameIconContainer: {
    marginRight: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  platformBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  platformText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatarWrapper: {
    position: 'relative',
    marginRight: -10,
    zIndex: 10,  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  placeholderAvatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  ownerBadgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    padding: 1,
  },
  emptySlot: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    marginLeft: -10,
  },
  moreSlots: {
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    marginLeft: -10,
  },
  moreSlotsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  slotCountText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.xl,
  },
  tag: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ownerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ownerInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ownerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  contactsContainer: {
    gap: theme.spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
