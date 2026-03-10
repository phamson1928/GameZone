import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FriendStatus, NotificationType } from '@prisma/client';

@Injectable()
export class FriendsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Gửi lời mời kết bạn
     */
    async sendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) {
            throw new BadRequestException('Không thể kết bạn với chính mình');
        }

        // Kiểm tra xem receiver có tồn tại không
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new NotFoundException('Người dùng không tồn tại');
        }

        // Kiểm tra chặn (Blocking)
        const block = await this.prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: senderId, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: senderId },
                ],
            },
        });
        if (block) {
            throw new BadRequestException('Không thể thực hiện hành động này do bị chặn');
        }

        // Kiểm tra quan hệ hiện tại
        const existing = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });

        if (existing) {
            if (existing.status === FriendStatus.ACCEPTED) {
                throw new ConflictException('Hai người đã là bạn bè');
            }
            if (existing.status === FriendStatus.PENDING) {
                if (existing.senderId === senderId) {
                    throw new ConflictException('Bạn đã gửi lời mời kết bạn rồi');
                } else {
                    throw new ConflictException(
                        'Người này đã gửi lời mời kết bạn cho bạn, hãy chấp nhận nó',
                    );
                }
            }
        }

        // Tạo friendship mới
        const friendship = await this.prisma.friendship.create({
            data: {
                senderId,
                receiverId,
                status: FriendStatus.PENDING,
            },
        });

        // Thông báo cho người nhận (Optional - Phase 9)
        await this.prisma.notification.create({
            data: {
                userId: receiverId,
                type: NotificationType.FRIEND_REQUEST,
                title: 'Lời mời kết bạn mới',
                data: { senderId, friendshipId: friendship.id },
            },
        });

        return friendship;
    }

    /**
     * Chấp nhận lời mời kết bạn
     */
    async acceptRequest(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });

        if (!friendship) {
            throw new NotFoundException('Lời mời kết bạn không tồn tại');
        }

        if (friendship.receiverId !== userId) {
            throw new BadRequestException('Bạn không phải là người nhận lời mời này');
        }

        if (friendship.status !== FriendStatus.PENDING) {
            throw new BadRequestException('Lời mời không còn ở trạng thái chờ');
        }

        const updated = await this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: FriendStatus.ACCEPTED },
        });

        // Thông báo cho người gửi
        await this.prisma.notification.create({
            data: {
                userId: friendship.senderId,
                type: NotificationType.FRIEND_ACCEPTED,
                title: 'Lời mời kết bạn đã được chấp nhận',
                data: { receiverId: userId, friendshipId },
            },
        });

        return updated;
    }

    /**
     * Lấy danh sách bạn bè (pagination)
     */
    async getFriends(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [friends, total] = await Promise.all([
            this.prisma.friendship.findMany({
                where: {
                    OR: [{ senderId: userId }, { receiverId: userId }],
                    status: FriendStatus.ACCEPTED,
                },
                include: {
                    sender: {
                        select: { id: true, username: true, avatarUrl: true },
                    },
                    receiver: {
                        select: { id: true, username: true, avatarUrl: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.friendship.count({
                where: {
                    OR: [{ senderId: userId }, { receiverId: userId }],
                    status: FriendStatus.ACCEPTED,
                },
            }),
        ]);

        return {
            data: friends,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy danh sách lời mời đang chờ (incoming)
     */
    async getPendingRequests(userId: string) {
        return this.prisma.friendship.findMany({
            where: {
                receiverId: userId,
                status: FriendStatus.PENDING,
            },
            include: {
                sender: {
                    select: { id: true, username: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Hủy bạn bè / Hủy lời mời / Từ chối lời mời
     */
    async removeFriendship(userId: string, targetUserId: string) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId },
                ],
            },
        });

        if (!friendship) {
            throw new NotFoundException('Không tìm thấy mối quan hệ bạn bè');
        }

        return this.prisma.friendship.delete({
            where: { id: friendship.id },
        });
    }
}
