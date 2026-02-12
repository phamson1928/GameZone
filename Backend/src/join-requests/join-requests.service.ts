import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/index.js';

@Injectable()
export class JoinRequestsService {
  constructor(private prisma: PrismaService) {}

  async sendJoinRequest(userId: string, zoneId: string) {
    const checkZone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
    });
    if (!checkZone) {
      throw new NotFoundException('Zone không tồn tại');
    }
    const existingRequest = await this.prisma.zoneJoinRequest.findFirst({
      where: {
        userId,
        zoneId,
      },
    });
    if (existingRequest) {
      throw new BadRequestException('Bạn đã gửi yêu cầu tham gia trước đó');
    }
    await this.prisma.zoneJoinRequest.create({
      data: {
        userId,
        zoneId,
        status: 'PENDING',
      },
    });
    return { message: 'Yêu cầu tham gia đã được gửi' };
  }

  async getJoinRequests(ownerId: string, zoneId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, ownerId },
    });
    if (!zone) {
      throw new NotFoundException(
        'Zone không tồn tại hoặc bạn không có quyền xem',
      );
    }
    const requests = await this.prisma.zoneJoinRequest.findMany({
      where: { zoneId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return requests;
  }

  async handleJoinRequest(
    ownerId: string,
    zoneId: string,
    requestId: string,
    action: 'APPROVED' | 'REJECTED',
  ) {
    const request = await this.prisma.zoneJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        zone: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Yêu cầu tham gia không tồn tại');
    }

    if (request.zoneId !== zoneId) {
      throw new BadRequestException('Yêu cầu không thuộc về zone này');
    }

    if (request.zone.ownerId !== ownerId) {
      throw new ForbiddenException('Bạn không có quyền xử lý yêu cầu này');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Yêu cầu đã được xử lý trước đó');
    }
    await this.prisma.zoneJoinRequest.update({
      where: { id: requestId },
      data: { status: action },
    });
    return {
      message: `Yêu cầu đã được ${action === 'APPROVED' ? 'phê duyệt' : 'từ chối'}`,
    };
  }

  async cancelJoinRequest(userId: string, zoneId: string) {
    const request = await this.prisma.zoneJoinRequest.findFirst({
      where: {
        userId,
        zoneId,
        status: 'PENDING',
      },
    });
    if (!request) {
      throw new NotFoundException(
        'Không tìm thấy yêu cầu tham gia đang chờ xử lý',
      );
    }
    await this.prisma.zoneJoinRequest.delete({
      where: { id: request.id },
    });
    return { message: 'Yêu cầu tham gia đã được hủy' };
  }

  async getUserJoinRequests(userId: string) {
    const requests = await this.prisma.zoneJoinRequest.findMany({
      where: { userId },
      include: {
        zone: true,
      },
    });
    return requests;
  }

  async getJoinRequestForUser(userId: string, zoneId: string) {
    const request = await this.prisma.zoneJoinRequest.findMany({
      where: { userId, zoneId },
    });
    return request;
  }
}
