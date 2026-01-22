import { Module } from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { JoinRequestsController } from './join-requests.controller';

@Module({
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}
