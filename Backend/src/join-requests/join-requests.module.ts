import { Module } from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { JoinRequestsController } from './join-requests.controller';
import { UsersJoinRequestsController } from './users-join-requests.controller';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [GroupsModule, NotificationsModule],
  controllers: [JoinRequestsController, UsersJoinRequestsController],
  providers: [JoinRequestsService],
  exports: [JoinRequestsService],
})
export class JoinRequestsModule {}
