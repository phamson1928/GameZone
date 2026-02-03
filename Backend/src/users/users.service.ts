import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UserResponseDto,
  PublicUserResponseDto,
  SearchUsersDto,
  UserActivityDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    await this.updateLastActive(userId);

    return this.toUserResponse(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

  async getAllUsersForAdmin(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: any[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const maxLimit = Math.min(limit, 100);
    const skip: number = (page - 1) * maxLimit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          profile: true,
        },
        skip,
        take: maxLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit: maxLimit,
        total,
        totalPages: Math.ceil(total / maxLimit),
      },
    };
  }

  async searchUsers(
    searchDto: SearchUsersDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: any[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const maxLimit = Math.min(limit, 100);
    const skip = (page - 1) * maxLimit;

    const where: Prisma.UserWhereInput = {};

    if (searchDto.query) {
      where.OR = [
        { email: { contains: searchDto.query, mode: 'insensitive' } },
        { username: { contains: searchDto.query, mode: 'insensitive' } },
      ];
    }

    if (searchDto.role) {
      where.role = searchDto.role as Prisma.EnumUserRoleFilter;
    }

    if (searchDto.status) {
      where.status = searchDto.status as Prisma.EnumUserStatusFilter;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        skip,
        take: maxLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit: maxLimit,
        total,
        totalPages: Math.ceil(total / maxLimit),
      },
    };
  }

  async getUserActivities(userId: string): Promise<UserActivityDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activities: UserActivityDto[] = [];

    const zones = await this.prisma.zone.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    zones.forEach((zone) => {
      activities.push({
        type: 'ZONE_CREATED',
        description: `Created zone: ${zone.title}`,
        createdAt: zone.createdAt,
        relatedId: zone.id,
        relatedType: 'zone',
      });
    });

    const joinRequests = await this.prisma.zoneJoinRequest.findMany({
      where: { userId },
      include: { zone: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    joinRequests.forEach((request) => {
      activities.push({
        type: `JOIN_REQUEST_${request.status}`,
        description: `Join request for "${request.zone.title}" - ${request.status}`,
        createdAt: request.createdAt,
        relatedId: request.id,
        relatedType: 'join_request',
      });
    });

    const groupMembers = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: { include: { zone: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    groupMembers.forEach((member) => {
      activities.push({
        type: 'GROUP_JOINED',
        description: `Joined group for zone: ${member.group.zone.title}`,
        createdAt: member.joinedAt,
        relatedId: member.groupId,
        relatedType: 'group',
      });
    });

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities.slice(0, 20);
  }

  async banUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (adminId && userId === adminId) {
      throw new BadRequestException('You cannot ban yourself');
    }

    if (user.status === 'BANNED') {
      throw new BadRequestException('User is already banned');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
      include: { profile: true },
    });

    return {
      success: true,
      message: 'User has been banned successfully',
      data: this.toPublicUserResponse(updatedUser),
    };
  }

  async unBanUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'BANNED') {
      throw new BadRequestException('User is not banned');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      include: { profile: true },
    });

    return {
      success: true,
      message: 'User has been unbanned successfully',
      data: this.toPublicUserResponse(updatedUser),
    };
  }

  async deleteUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (adminId && userId === adminId) {
      throw new BadRequestException('You cannot delete yourself');
    }

    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'BANNED',
        email: `deleted_${userId}@deleted.com`,
        username: `deleted_${userId}`,
      },
    });

    return {
      success: true,
      message: 'User has been deleted successfully',
      data: { id: deletedUser.id },
    };
  }

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

  private toPublicUserResponse(user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    profile?: {
      bio: string | null;
      playStyle: string | null;
      timezone: string | null;
      lastActiveAt: Date | null;
    } | null;
  }): PublicUserResponseDto {
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
}
