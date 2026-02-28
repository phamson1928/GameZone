import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsCleanupService } from './notifications-cleanup.service';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ChatModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsCleanupService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
