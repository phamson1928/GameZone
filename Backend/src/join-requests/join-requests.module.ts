import { Module } from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { JoinRequestsController } from './join-requests.controller';
import { UsersJoinRequestsController } from './users-join-requests.controller';

@Module({
  controllers: [JoinRequestsController, UsersJoinRequestsController],
  providers: [JoinRequestsService],
  exports: [JoinRequestsService],
})
export class JoinRequestsModule {}
