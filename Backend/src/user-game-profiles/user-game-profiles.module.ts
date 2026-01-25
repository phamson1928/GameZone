import { Module } from '@nestjs/common';
import { UserGameProfilesService } from './user-game-profiles.service';
import { UserGameProfilesController } from './user-game-profiles.controller';

@Module({
  controllers: [UserGameProfilesController],
  providers: [UserGameProfilesService],
})
export class UserGameProfilesModule {}
