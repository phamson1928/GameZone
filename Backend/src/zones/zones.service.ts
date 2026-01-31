import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createZoneDto: CreateZoneDto) {
    const { tagIds, contactValue, ...zoneData } = createZoneDto;

    // Kiểm tra giới hạn tạo zone
    const zoneCount = await this.prisma.zone.count({
      where: { ownerId },
    });
    if (zoneCount >= 4) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn tạo zone (tối đa 4 zone)',
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
    if (contactValue && contactValue.length > 0) {
      await this.prisma.zoneContactMethod.createMany({
        data: contactValue.map((contactValue) => ({
          zoneId: zone.id,
          type: 'INGAME',
          value: contactValue,
        })),
      });
    }

    // Trả về zone đầy đủ
    return this.findOne(zone.id);
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, totalOpen, totalFull, totalClosed] = await Promise.all([
      this.prisma.zone.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: { include: { tag: true } },
          owner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.zone.count({ where: { status: 'OPEN' } }),
      this.prisma.zone.count({ where: { status: 'FULL' } }),
      this.prisma.zone.count({ where: { status: 'CLOSED' } }),
    ]);

    const total = totalOpen + totalFull + totalClosed;

    return {
      data,
      totalOpen,
      totalFull,
      totalClosed,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
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
        joinRequests: {
          where: { status: 'PENDING' },
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
      throw new BadRequestException('Zone không tồn tại');
    }

    return zone;
  }

  async findByOwner(ownerId: string) {
    return this.prisma.zone.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        contacts: {
          select: {
            type: true,
            value: true,
          },
        },
        _count: {
          select: {
            joinRequests: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    ownerId: string,
    updateZoneDto: UpdateZoneDto & {
      tagIds?: string[];
      contactValue?: string[];
    },
  ) {
    // Tách dữ liệu zone và relations
    const { tagIds, contactValue, ...zoneData } = updateZoneDto;

    // Kiểm tra quyền sở hữu
    const zone = await this.prisma.zone.findFirst({
      where: { id, ownerId },
    });
    if (!zone) {
      throw new ForbiddenException('Bạn không có quyền sửa zone này');
    }

    // Bước 1: Cập nhật zone info nếu có
    if (Object.keys(zoneData).length > 0) {
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

    // Bước 3: Nếu có contactValue thì cập nhật contacts
    if (contactValue !== undefined) {
      // Xóa contacts cũ
      await this.prisma.zoneContactMethod.deleteMany({
        where: { zoneId: id },
      });

      // Thêm contacts mới nếu có
      if (contactValue.length > 0) {
        await this.prisma.zoneContactMethod.createMany({
          data: contactValue.map((contactValue) => ({
            zoneId: id,
            type: 'INGAME',
            value: contactValue,
          })),
        });
      }
    }

    // Trả về zone đã cập nhật với đầy đủ relations
    return this.findOne(id);
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
    await this.prisma.zone.delete({
      where: { id },
    });

    return { message: 'Zone đã được xóa bởi admin' };
  }
}
