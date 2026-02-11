import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { SearchZonesDto, ZoneSortBy } from './dto/search-zones.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, ContactMethodType } from '@prisma/client';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createZoneDto: CreateZoneDto) {
    const { tagIds, contacts, ...zoneData } = createZoneDto;

    // Kiểm tra giới hạn tạo zone
    const zoneCount = await this.prisma.zone.count({
      where: { ownerId },
    });
    if (zoneCount >= 4) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn tạo zone (tối đa 4 zone)',
      );
    }

    // Kiểm tra game có tồn tại không
    const game = await this.prisma.game.findUnique({
      where: { id: zoneData.gameId },
    });
    if (!game) {
      throw new BadRequestException('Game không tồn tại');
    }

    // Kiểm tra rank level logic
    const rankOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];
    if (
      rankOrder.indexOf(zoneData.minRankLevel) >
      rankOrder.indexOf(zoneData.maxRankLevel)
    ) {
      throw new BadRequestException(
        'Rank tối thiểu không thể lớn hơn rank tối đa',
      );
    }

    // Bước 1: Tạo zone trước (không có tags/contacts)
    const zone = await this.prisma.zone.create({
      data: {
        ...zoneData,
        ownerId,
      },
    });

    // Bước 2: Thêm tags nếu có
    if (tagIds && tagIds.length > 0) {
      await this.prisma.zoneTagRelation.createMany({
        data: tagIds.map((tagId) => ({
          zoneId: zone.id,
          tagId,
        })),
      });
    }

    // Bước 3: Thêm contacts nếu có
    if (contacts && contacts.length > 0) {
      await this.prisma.zoneContactMethod.createMany({
        data: contacts.map((c) => ({
          zoneId: zone.id,
          type: c.type,
          value: c.value,
        })),
      });
    }

    // Trả về zone đầy đủ
    return this.findOneByOwner(zone.id, ownerId);
  }

  async findAllByUser(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.prisma.zone.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return {
      data,
      meta: {
        page,
        limit,
      },
    };
  }

  async findAllByAdmin(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.zone.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              joinRequests: true,
            },
          },
        },
      }),
      this.prisma.zone.count(),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.zone.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            joinRequests: true,
          },
        },
        game: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async search(dto: SearchZonesDto) {
    const { q, sortBy = ZoneSortBy.NEWEST, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ZoneWhereInput = {};

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { owner: { username: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.ZoneOrderByWithRelationInput;
    switch (sortBy) {
      case ZoneSortBy.OLDEST:
        orderBy = { createdAt: 'asc' };
        break;
      case ZoneSortBy.PLAYERS_ASC:
        orderBy = { requiredPlayers: 'asc' };
        break;
      case ZoneSortBy.PLAYERS_DESC:
        orderBy = { requiredPlayers: 'desc' };
        break;
      case ZoneSortBy.NEWEST:
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.zone.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          game: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.zone.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        query: q || null,
        sortBy,
      },
    };
  }

  async findOneByPublic(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        contacts: {
          select: {
            type: true,
            value: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        game: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
          },
        },
        joinRequests: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException('Zone không tồn tại');
    }

    return zone;
  }

  async findOneByOwner(id: string, ownerId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id, ownerId },
      include: {
        tags: { include: { tag: true } },
        contacts: {
          select: {
            type: true,
            value: true,
          },
        },
        joinRequests: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            joinRequests: true,
          },
        },
        game: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(
        'Zone không tồn tại hoặc bạn không có quyền xem',
      );
    }

    return zone;
  }

  async update(id: string, ownerId: string, updateZoneDto: UpdateZoneDto) {
    // Tách dữ liệu zone và relations
    const { tagIds, contacts, ...zoneData } = updateZoneDto;

    // Type guard for contacts
    const typedContacts = contacts as
      | Array<{ type: string; value: string }>
      | undefined;

    // Kiểm tra quyền sở hữu
    const zone = await this.prisma.zone.findFirst({
      where: { id, ownerId },
    });
    if (!zone) {
      throw new ForbiddenException('Bạn không có quyền sửa zone này');
    }

    // Bước 1: Cập nhật zone info nếu có
    if (Object.keys(zoneData).length > 0) {
      // Kiểm tra rank level logic nếu cả 2 được update
      const minRank = zoneData.minRankLevel || zone.minRankLevel;
      const maxRank = zoneData.maxRankLevel || zone.maxRankLevel;
      const rankOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];

      if (rankOrder.indexOf(minRank) > rankOrder.indexOf(maxRank)) {
        throw new BadRequestException(
          'Rank tối thiểu không thể lớn hơn rank tối đa',
        );
      }

      await this.prisma.zone.update({
        where: { id },
        data: zoneData,
      });
    }

    // Bước 2: Nếu có tagIds thì cập nhật tags
    if (tagIds !== undefined) {
      // Xóa tags cũ
      await this.prisma.zoneTagRelation.deleteMany({
        where: { zoneId: id },
      });

      // Thêm tags mới nếu có
      if (tagIds.length > 0) {
        await this.prisma.zoneTagRelation.createMany({
          data: tagIds.map((tagId) => ({
            zoneId: id,
            tagId,
          })),
        });
      }
    }

    // Bước 3: Nếu có contacts thì cập nhật
    if (typedContacts !== undefined) {
      // Xóa contacts cũ
      await this.prisma.zoneContactMethod.deleteMany({
        where: { zoneId: id },
      });

      // Thêm contacts mới nếu có
      if (typedContacts.length > 0) {
        await this.prisma.zoneContactMethod.createMany({
          data: typedContacts.map((c) => ({
            zoneId: id,
            type: c.type as ContactMethodType,
            value: c.value,
          })),
        });
      }
    }

    // Trả về zone đã cập nhật với đầy đủ relations
    return this.findOneByOwner(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    // Kiểm tra quyền sở hữu
    const zone = await this.prisma.zone.findFirst({
      where: { id, ownerId },
    });
    if (!zone) {
      throw new ForbiddenException('Bạn không có quyền xóa zone này');
    }

    // Xóa zone (cascade sẽ xóa tags và contacts)
    await this.prisma.zone.delete({
      where: { id },
    });

    return { message: 'Zone đã được xóa thành công' };
  }

  // Admin methods
  async findAllForAdmin(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.zone.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              joinRequests: true,
            },
          },
        },
      }),
      this.prisma.zone.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminDeleteZone(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Zone không tồn tại');
    }

    await this.prisma.zone.delete({
      where: { id },
    });

    return { message: 'Zone đã được xóa bởi admin' };
  }

  async adminCloseZone(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Zone không tồn tại');
    }

    const updatedZone = await this.prisma.zone.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Zone đã được đóng bởi admin',
      data: updatedZone,
    };
  }
}
