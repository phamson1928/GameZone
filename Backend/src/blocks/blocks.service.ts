import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlocksService {
    constructor(private prisma: PrismaService) { }

    async blockUser(blockerId: string, blockedId: string) {
        if (blockerId === blockedId) {
            throw new BadRequestException('You cannot block yourself');
        }

        const targetUser = await this.prisma.user.findUnique({
            where: { id: blockedId },
        });

        if (!targetUser) {
            throw new NotFoundException('User to block not found');
        }

        // Check if already blocked
        const existingBlock = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });

        if (existingBlock) {
            throw new BadRequestException('User is already blocked');
        }

        // Remove friendship if exists
        await this.prisma.friendship.deleteMany({
            where: {
                OR: [
                    { senderId: blockerId, receiverId: blockedId },
                    { senderId: blockedId, receiverId: blockerId },
                ],
            },
        });

        return this.prisma.userBlock.create({
            data: {
                blockerId,
                blockedId,
            },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async unblockUser(blockerId: string, blockedId: string) {
        const existingBlock = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });

        if (!existingBlock) {
            throw new BadRequestException('User is not blocked');
        }

        return this.prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
    }

    async getMyBlockedUsers(userId: string) {
        return this.prisma.userBlock.findMany({
            where: { blockerId: userId },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
        const block = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        return !!block;
    }
}
