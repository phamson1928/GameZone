import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * MessagesCleanupService — Tự động dọn dẹp messages cũ để tránh database overflow.
 *
 * Chiến lược:
 *   - Mỗi ngày lúc 3:00 AM: hard delete messages cũ hơn 30 ngày
 *   - Mỗi ngày lúc 3:05 AM: hard delete messages của group đã dissolved (isActive: false)
 *     nếu chúng tồn tại quá 1 ngày (safety buffer)
 */
@Injectable()
export class MessagesCleanupService {
    private readonly logger = new Logger(MessagesCleanupService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Chạy mỗi ngày lúc 3:00 AM — xóa messages cũ hơn 30 ngày.
     * Đây là chiến lược chính để giữ database không bị tràn.
     */
    @Cron('0 3 * * *', { name: 'purge-old-messages' })
    async purgeOldMessages() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        this.logger.log(
            `[Cleanup] Bắt đầu xóa messages cũ hơn 30 ngày (trước ${thirtyDaysAgo.toISOString()})...`,
        );

        try {
            const result = await this.prisma.message.deleteMany({
                where: {
                    createdAt: { lt: thirtyDaysAgo },
                },
            });

            this.logger.log(
                `[Cleanup] Đã xóa ${result.count} messages cũ hơn 30 ngày.`,
            );
        } catch (error) {
            this.logger.error('[Cleanup] Lỗi khi xóa messages cũ:', error);
        }
    }

    /**
     * Chạy mỗi ngày lúc 3:05 AM — xóa messages của các group đã dissolved.
     * Safety buffer 1 ngày: group dissolved hôm qua mới xóa, tránh xóa ngay lập tức.
     *
     * Lưu ý: Trong hệ thống mới (sau khi có hard delete group), dissolveGroup() sẽ
     * cascade xóa messages ngay. Job này là safety net cho các group dissolved cũ
     * (trước khi áp dụng hard delete) còn sót lại messages.
     */
    @Cron('5 3 * * *', { name: 'purge-dissolved-group-messages' })
    async purgeDissolvedGroupMessages() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        this.logger.log(
            '[Cleanup] Bắt đầu xóa messages của groups đã dissolved...',
        );

        try {
            const result = await this.prisma.message.deleteMany({
                where: {
                    group: {
                        isActive: false,
                    },
                    createdAt: { lt: oneDayAgo },
                },
            });

            this.logger.log(
                `[Cleanup] Đã xóa ${result.count} messages của groups đã dissolved.`,
            );
        } catch (error) {
            this.logger.error(
                '[Cleanup] Lỗi khi xóa messages của dissolved groups:',
                error,
            );
        }
    }
}
