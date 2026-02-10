import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGameDto) {
    return this.prisma.game.create({
      data: dto,
    });
  }

  async findAllForAdmin(page?: number, limit?: number) {
    const pageLimit = limit || 10;
    const skip: number = ((page || 1) - 1) * pageLimit;
    return this.prisma.game.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        platforms: true,
        createdAt: true,
        _count: {
          select: { groups: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageLimit,
    });
  }

  async findAllForUser() {
    return this.prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        bannerUrl: true,
        platforms: true,
        _count: {
          select: { zones: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        zones: {
          where: { status: 'OPEN' },
          select: {
            title: true,
            description: true,
            minRankLevel: true,
            maxRankLevel: true,
            requiredPlayers: true,
          },
        },
      },
    });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} không tồn tại`);
    }
    return game;
  }

  async update(id: string, dto: UpdateGameDto) {
    await this.findOne(id);
    return this.prisma.game.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.game.delete({
      where: { id },
    });
  }
}
