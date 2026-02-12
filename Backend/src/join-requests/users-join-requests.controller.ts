import { Controller, Get } from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Join Requests')
export class UsersJoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) {}

  @Get('me/join-requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tham gia của bản thân' })
  @ApiBearerAuth()
  getUserJoinRequests(@CurrentUser('sub') userId: string) {
    return this.joinRequestsService.getUserJoinRequests(userId);
  }
}
