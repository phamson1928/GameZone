import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateZoneInviteDto } from './dto/create-zone-invite.dto';
import { HandleZoneInviteDto } from './dto/handle-zone-invite.dto';
import { NotificationType, ZoneInviteStatus } from '@prisma/client';

@Injectable()
export class ZoneInvitesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ) { }

    async inviteToZone(inviterId: string, zoneId: string, dto: CreateZoneInviteDto) {
        const { inviteeId } = dto;

        // Kiểm tra zone tồn tại và inviter là owner
        const zone = await this.prisma.zone.findUnique({
            where: { id: zoneId },
            include: { owner: { select: { id: true, username: true } } },
        });

        if (!zone) throw new NotFoundException('Zone không tồn tại');
        if (zone.ownerId !== inviterId) {
            throw new ForbiddenException('Chỉ chủ zone mới có thể mời bạn bè');
        }
        if (zone.status !== 'OPEN') {
            throw new BadRequestException('Zone không còn mở để nhận người mới');
        }
        if (inviteeId === inviterId) {
            throw new BadRequestException('Bạn không thể mời chính mình');
        }

        // Kiểm tra chặn (Blocking)
        const block = await this.prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: inviterId, blockedId: inviteeId },
                    { blockerId: inviteeId, blockedId: inviterId },
                ],
            },
        });
        if (block) {
            throw new BadRequestException('Không thể thực hiện hành động này do bị chặn');
        }

        // Kiểm tra invitee có trong friend list không
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: inviterId, receiverId: inviteeId },
                    { senderId: inviteeId, receiverId: inviterId },
                ],
                status: 'ACCEPTED',
            },
        });
        if (!friendship) {
            throw new BadRequestException('Chỉ có thể mời bạn bè vào zone');
        }

        // Kiểm tra đã mời chưa
        const existingInvite = await this.prisma.zoneInvite.findUnique({
            where: { zoneId_inviteeId: { zoneId, inviteeId } },
        });
        if (existingInvite) {
            if (existingInvite.status === ZoneInviteStatus.PENDING) {
                throw new ConflictException('Người dùng này đã được mời rồi');
            }
            // Nếu đã DECLINED trước đó, cho phép mời lại
            await this.prisma.zoneInvite.delete({ where: { id: existingInvite.id } });
        }

        const invite = await this.prisma.zoneInvite.create({
            data: { zoneId, inviterId, inviteeId },
            include: {
                zone: { select: { id: true, title: true } },
                invitee: { select: { id: true, username: true } },
            },
        });

        // Thông báo cho invitee
        await this.notifications.create(inviteeId, {
            type: NotificationType.ZONE_INVITE,
            title: `Bạn được mời vào zone "${zone.title}"`,
            data: {
                zoneId,
                zoneName: zone.title,
                inviterId,
                inviterName: zone.owner.username,
                inviteId: invite.id,
            },
        });

        return invite;
    }

    async handleInvite(userId: string, inviteId: string, dto: HandleZoneInviteDto) {
        const invite = await this.prisma.zoneInvite.findUnique({
            where: { id: inviteId },
            include: {
                zone: { select: { id: true, title: true, ownerId: true, status: true } },
            },
        });

        if (!invite) throw new NotFoundException('Lời mời không tồn tại');
        if (invite.inviteeId !== userId) {
            throw new ForbiddenException('Bạn không có quyền xử lý lời mời này');
        }
        if (invite.status !== ZoneInviteStatus.PENDING) {
            throw new BadRequestException('Lời mời này đã được xử lý rồi');
        }

        if (dto.status === ZoneInviteStatus.DECLINED) {
            await this.prisma.zoneInvite.update({
                where: { id: inviteId },
                data: { status: ZoneInviteStatus.DECLINED },
            });
            return { message: 'Đã từ chối lời mời' };
        }

        // ACCEPTED: kiểm tra zone còn mở không, rồi tạo join request auto-approve
        if (invite.zone.status !== 'OPEN') {
            throw new BadRequestException('Zone đã đóng, không thể tham gia nữa');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.zoneInvite.update({
                where: { id: inviteId },
                data: { status: ZoneInviteStatus.ACCEPTED },
            });

            // Tạo ZoneJoinRequest với trạng thái APPROVED (auto-approve vì đã được invite)
            const existingReq = await tx.zoneJoinRequest.findUnique({
                where: { zoneId_userId: { zoneId: invite.zoneId, userId } },
            });
            if (!existingReq) {
                await tx.zoneJoinRequest.create({
                    data: {
                        zoneId: invite.zoneId,
                        userId,
                        status: 'APPROVED',
                    },
                });
            } else {
                await tx.zoneJoinRequest.update({
                    where: { id: existingReq.id },
                    data: { status: 'APPROVED' },
                });
            }
        });

        return { message: 'Đã chấp nhận lời mời, bạn đã tham gia zone' };
    }

    async getMyInvites(userId: string) {
        const invites = await this.prisma.zoneInvite.findMany({
            where: {
                inviteeId: userId,
                status: ZoneInviteStatus.PENDING,
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        game: { select: { id: true, name: true, iconUrl: true } },
                    },
                },
                inviter: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return invites;
    }

    async cancelInvite(inviterId: string, zoneId: string, inviteId: string) {
        const invite = await this.prisma.zoneInvite.findFirst({
            where: { id: inviteId, zoneId },
        });
        if (!invite) throw new NotFoundException('Lời mời không tồn tại');

        const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
        if (zone?.ownerId !== inviterId) {
            throw new ForbiddenException('Bạn không có quyền hủy lời mời này');
        }

        await this.prisma.zoneInvite.delete({ where: { id: inviteId } });
        return { message: 'Đã hủy lời mời' };
    }
}
