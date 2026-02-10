export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BANNED';
export type RankLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
export type ZoneStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type Platform = 'PC' | 'CONSOLE' | 'MOBILE';
export type ContactMethodType = 'DISCORD' | 'INGAME' | 'OTHER';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  profile?: UserProfile | null;
}

export interface UserProfile {
  bio?: string | null;
  playStyle?: string | null;
  timezone?: string | null;
  lastActiveAt?: string | null;
}

export interface Game {
  id: string;
  name: string;
  iconUrl: string;
  bannerUrl: string;
  isActive: boolean;
  platforms: Platform[];
  createdAt: string;
  _count?: {
    zones: number;
    groups: number;
  };
}

export interface UserGameProfile {
  id: string;
  userId: string;
  gameId: string;
  rankLevel: RankLevel;
  game: {
    name: string;
    iconUrl: string;
    bannerUrl?: string;
  };
}

export interface Zone {
  id: string;
  gameId: string;
  ownerId: string;
  title: string;
  description: string;
  minRankLevel: RankLevel;
  maxRankLevel: RankLevel;
  requiredPlayers: number;
  status: ZoneStatus;
  createdAt: string;
  tags: ZoneTagRelation[];
  contacts: Contact[];
  owner: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  game?: Game;
  _count?: {
    joinRequests: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface ZoneTagRelation {
  zoneId: string;
  tagId: string;
  tag: Tag;
}

export interface Contact {
  id: string;
  type: ContactMethodType;
  value: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
