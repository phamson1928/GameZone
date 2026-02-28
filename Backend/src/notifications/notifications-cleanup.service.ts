import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NotificationsCleanupService — Xóa notifications cũ để tránh database overflow.
 * Chạy mỗi ngày lúc 3:10 AM: xóa notifications đã đọc & cũ hơn 90 ngày.
 */
@Injectable()
export class NotificationsCleanupService {
  private readonly logger = new Logger(NotificationsCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('10 3 * * *', { name: 'purge-old-notifications' })
  async purgeOldNotifications() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    this.logger.log(
      `[Cleanup] Bắt đầu xóa notifications đã đọc cũ hơn 90 ngày (trước ${ninetyDaysAgo.toISOString()})...`,
    );

    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: ninetyDaysAgo },
        },
      });

      this.logger.log(
        `[Cleanup] Đã xóa ${result.count} notifications đã đọc cũ hơn 90 ngày.`,
      );
    } catch (error) {
      this.logger.error('[Cleanup] Lỗi khi xóa notifications cũ:', error);
    }
  }
}
