import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UserResponseDto,
  PublicUserResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current user's full profile
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update last active time
    await this.updateLastActive(userId);

    return this.toUserResponse(user);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    // Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update or create profile
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: updateProfileDto,
      create: {
        userId,
        ...updateProfileDto,
      },
    });

    return this.getMe(userId);
  }

  /**
   * Get public profile of another user
   */
  async getPublicProfile(userId: string): Promise<PublicUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === 'BANNED') {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      profile: user.profile
        ? {
            bio: user.profile.bio,
            playStyle: user.profile.playStyle,
            timezone: user.profile.timezone,
            lastActiveAt: user.profile.lastActiveAt,
          }
        : null,
    };
  }

  /**
   * Update user's avatar URL
   */
  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { profile: true },
    });

    return this.toUserResponse(user);
  }

  /**
   * Update last active timestamp
   */
  private async updateLastActive(userId: string): Promise<void> {
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: { lastActiveAt: new Date() },
      create: {
        userId,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Convert Prisma user to response DTO
   */
  private toUserResponse(user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    role: string;
    status: string;
    createdAt: Date;
    profile?: {
      bio: string | null;
      playStyle: string | null;
      timezone: string | null;
      lastActiveAt: Date | null;
    } | null;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            bio: user.profile.bio,
            playStyle: user.profile.playStyle,
            timezone: user.profile.timezone,
            lastActiveAt: user.profile.lastActiveAt,
          }
        : null,
    };
  }
}
