import { RankLevel } from '../types';
import { theme } from '../theme';

// Vietnamese display names for rank levels
export const RANK_DISPLAY: Record<RankLevel, string> = {
  BEGINNER: 'Con gà',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Cao thủ',
  PRO: 'Tuyển thủ',
};

// Rank levels in order
export const RANK_LEVELS: RankLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];

// Colors for each rank level
export const RANK_COLORS: Record<RankLevel, string> = {
  BEGINNER: theme.colors.success,
  INTERMEDIATE: theme.colors.info,
  ADVANCED: '#9C27B0',
  PRO: '#FFD700',
};

// Get display name for a rank
export const getRankDisplay = (rank: RankLevel): string => {
  return RANK_DISPLAY[rank] || rank;
};

// Get color for a rank
export const getRankColor = (rank: RankLevel): string => {
  return RANK_COLORS[rank] || theme.colors.textSecondary;
};
