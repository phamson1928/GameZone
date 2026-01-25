import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserGameProfileDto } from './dto/create-user-game-profile.dto';
import { UpdateUserGameProfileDto } from './dto/update-user-game-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserGameProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateUserGameProfileDto) {
    // Check if game exists
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    try {
      return await this.prisma.userGameProfile.create({
        data: {
          userId,
          gameId: dto.gameId,
          rankLevel: dto.rankLevel,
        },
        include: {
          game: {
            select: { name: true, iconUrl: true },
          },
        },
      });
    } catch (error) {
      if (error === 'P2002') {
        throw new ConflictException('You already have a profile for this game');
      }
      throw error;
    }
  }

  async findAllByMe(userId: string) {
    return this.prisma.userGameProfile.findMany({
      where: { userId },
      include: {
        game: {
          select: { name: true, iconUrl: true, bannerUrl: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.userGameProfile.findUnique({
      where: { id },
      include: {
        game: {
          select: { name: true, iconUrl: true },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('User game profile not found');
    }
    return profile;
  }

  async update(userId: string, id: string, dto: UpdateUserGameProfileDto) {
    const profile = await this.findOne(id);

    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.prisma.userGameProfile.update({
      where: { id },
      data: { rankLevel: dto.rankLevel },
    });
  }

  async remove(userId: string, id: string) {
    const profile = await this.findOne(id);

    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    return this.prisma.userGameProfile.delete({
      where: { id },
    });
  }
}
