import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesCleanupService } from './messages-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Kích hoạt cron jobs
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesCleanupService],
  exports: [MessagesService],
})
export class MessagesModule { }
