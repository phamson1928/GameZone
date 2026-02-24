import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupMemberRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Tự động tạo Group khi Zone đủ người approved.
   * Gọi sau mỗi lần approve join request.
   * Returns Group nếu tạo thành công, null nếu chưa đủ điều kiện.
   */
  async createGroupFromZone(zoneId: string) {
    return this.prisma.$transaction(async (tx) => {
      const zone = await tx.zone.findUnique({
        where: { id: zoneId },
        include: {
          joinRequests: { where: { status: 'APPROVED' } },
          group: true,
        },
      });

      // Guard: zone không tồn tại, đã có group, hoặc chưa đủ người
      if (!zone || zone.group) return null;

      const approvedCount = zone.joinRequests.length;
      if (approvedCount < zone.requiredPlayers) return null;

      // Tạo Group + Members (owner = LEADER, approved users = MEMBER)
      const group = await tx.group.create({
        data: {
          zoneId: zone.id,
          leaderId: zone.ownerId,
          gameId: zone.gameId,
          members: {
            createMany: {
              data: [
                { userId: zone.ownerId, role: 'LEADER' },
                ...zone.joinRequests.map((req) => ({
                  userId: req.userId,
                  role: 'MEMBER' as const,
                })),
              ],
            },
          },
        },
      });

      // Chuyển Zone → FULL
      await tx.zone.update({
        where: { id: zoneId },
        data: { status: 'FULL' },
      });

      return group;
    });
  }

  /**
   * GET /groups - Danh sách groups của user hiện tại
   */
  async getUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: { some: { userId } },
        isActive: true,
      },
      include: {
        zone: { select: { id: true, title: true, status: true } },
        game: { select: { id: true, name: true, iconUrl: true } },
        leader: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GET /groups/:id - Chi tiết group (chỉ member mới được xem)
   */
  async getGroupDetail(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        zone: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            minRankLevel: true,
            maxRankLevel: true,
          },
        },
        game: { select: { id: true, name: true, iconUrl: true } },
        leader: {
          select: { id: true, username: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group không tồn tại');
    }

    // Chỉ member mới được xem chi tiết
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc group này');
    }

    return group;
  }

  /**
   * POST /groups/:id/leave - Rời group (member only, leader phải giải tán)
   */
  async leaveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group || !group.isActive) {
      throw new NotFoundException('Group không tồn tại');
    }

    const member = group.members.find((m) => m.userId === userId);
    if (!member) {
      throw new BadRequestException('Bạn không thuộc group này');
    }

    // Leader không được leave → phải giải tán
    if (member.role === 'LEADER') {
      throw new BadRequestException(
        'Leader không thể rời group. Hãy giải tán group thay vì rời.',
      );
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { message: 'Đã rời khỏi group' };
  }

  /**
   * DELETE /groups/:id - Giải tán group (leader only, hard delete)
   * Nhờ onDelete: Cascade, xóa group sẽ tự động xóa GroupMember + Message
   */
  async dissolveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group || !group.isActive) {
      throw new NotFoundException('Group không tồn tại');
    }

    if (group.leaderId !== userId) {
      throw new ForbiddenException('Chỉ leader mới được giải tán group');
    }

    // Xóa Zone -> Chuỗi Cascade sẽ tự động xóa: Group, GroupMember và Message
    await this.prisma.zone.delete({
      where: { id: group.zoneId },
    });

    return { message: 'Nhóm và bài đăng đã được xóa hoàn toàn' };
  }

  /**
   * GET /groups/:id/members - Danh sách members của group (member-only)
   */
  async getGroupMembers(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group || !group.isActive) {
      throw new NotFoundException('Group không tồn tại');
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc group này');
    }

    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * DELETE /groups/:id/members/:userId - Kick member (leader only)
   */
  async kickMember(leaderId: string, groupId: string, targetUserId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group || !group.isActive) {
      throw new NotFoundException('Group không tồn tại');
    }

    if (group.leaderId !== leaderId) {
      throw new ForbiddenException('Chỉ leader mới có quyền kick member');
    }

    if (targetUserId === leaderId) {
      throw new BadRequestException('Leader không thể kick chính mình');
    }

    const targetMember = group.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundException('User không phải là thành viên của group');
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    return { message: 'Đã kick member khỏi group' };
  }

  /**
   * PATCH /groups/:id/members/:userId - Đổi role member (leader only)
   * Khi chuyển role LEADER cho member khác, leader hiện tại sẽ trở thành MEMBER.
   */
  async changeMemberRole(
    leaderId: string,
    groupId: string,
    targetUserId: string,
    newRole: GroupMemberRole,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group || !group.isActive) {
      throw new NotFoundException('Group không tồn tại');
    }

    if (group.leaderId !== leaderId) {
      throw new ForbiddenException('Chỉ leader mới có quyền đổi role');
    }

    if (targetUserId === leaderId) {
      throw new BadRequestException(
        'Không thể đổi role của chính mình. Hãy chuyển leader cho người khác.',
      );
    }

    const targetMember = group.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundException('User không phải là thành viên của group');
    }

    if (targetMember.role === newRole) {
      throw new BadRequestException(`User đã có role ${newRole}`);
    }

    // Nếu chuyển LEADER cho member khác → leader hiện tại thành MEMBER
    if (newRole === 'LEADER') {
      await this.prisma.$transaction([
        this.prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: targetUserId } },
          data: { role: 'LEADER' },
        }),
        this.prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: leaderId } },
          data: { role: 'MEMBER' },
        }),
        this.prisma.group.update({
          where: { id: groupId },
          data: { leaderId: targetUserId },
        }),
      ]);

      return { message: `Đã chuyển quyền leader cho user` };
    }

    // Đổi role thông thường (LEADER → MEMBER không áp dụng ở đây vì target không phải leader)
    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: newRole },
    });

    return { message: `Đã đổi role thành ${newRole}` };
  }

  // ========================
  // Admin methods
  // ========================

  /**
   * GET /groups/admin - Danh sách tất cả groups (Admin, pagination)
   */
  async adminGetAllGroups(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        skip,
        take: limit,
        include: {
          zone: { select: { id: true, title: true, status: true } },
          game: { select: { id: true, name: true, iconUrl: true } },
          leader: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: { select: { members: true, messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count(),
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
   * DELETE /groups/admin/:id - Force dissolve group (Admin, hard delete)
   * Nhờ onDelete: Cascade, xóa group sẽ tự động xóa GroupMember + Message
   */
  async adminForceDissolve(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group không tồn tại');
    }

    // Admin xóa Zone -> Dọn dẹp sạch toàn bộ dữ liệu liên quan
    await this.prisma.zone.delete({
      where: { id: group.zoneId },
    });

    return { message: 'Nhóm đã được admin xóa hoàn toàn khỏi hệ thống' };
  }

  /**
   * GET /groups/admin/:id/messages - Xem messages của group (Admin)
   */
  async adminGetGroupMessages(
    groupId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group không tồn tại');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { groupId },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where: { groupId } }),
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
}
