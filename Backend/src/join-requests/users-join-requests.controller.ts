import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JoinRequestsService } from './join-requests.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@ApiTags('Join Requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UsersJoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) { }

  @Get('me/join-requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tham gia của bản thân' })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserJoinRequests(@CurrentUser('sub') userId: string) {
    return this.joinRequestsService.getUserJoinRequests(userId);
  }
}
