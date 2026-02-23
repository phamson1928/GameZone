import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  /**
 * Lấy lịch sử chat của một group (chỉ member mới được xem).
 * Trả về tin nhắn theo trang, mỗi trang mặc định 30 tin, sắp xếp mới nhất → cũ nhất.
 */
  async getGroupMessages(userId: string, groupId: string, page: number = 1, limit: number = 30) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    })

    if (!member) {
      throw new ForbiddenException('Bạn không phải thành viên của group này')
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          groupId,
          isDeleted: false,// Không lấy tin nhắn đã xóa
        },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        // Lấy mới nhất trước để dễ phân trang
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({
        where: { groupId, isDeleted: false },
      }),
    ]);

    return {
      data: data.reverse(),// Đảo lại để hiển thị theo thứ tự cũ → mới
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
 * Tạo một tin nhắn mới vào DB.
 * Hàm này được gọi từ ChatGateway (WebSocket), không phải từ REST API.
 */
  async createMessage(senderId: string, groupId: string, content: string) {
    return this.prisma.message.create({
      data: { groupId, senderId, content },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  /**
 * Người dùng xóa tin nhắn của chính mình (soft delete).
 * Chỉ người gửi mới được xóa.
 */
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể xoá tin nhắn của mình');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { message: 'Đã xóa tin nhắn' };
  }

  // ========================
  // Admin methods
  // ========================

  /**
   * Admin lấy danh sách tất cả messages (kể cả đã xóa).
   */
  async adminGetMessages(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
          group: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count(),
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

  /**
   * Admin xóa bất kỳ tin nhắn nào (soft delete).
   */
  async adminDeleteMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { message: 'Admin đã xóa tin nhắn' };
  }
}