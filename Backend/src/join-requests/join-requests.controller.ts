import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('zones')
@ApiTags('Join Requests')
export class JoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) {}

  @Post(':id/join')
  @ApiOperation({ summary: 'Gửi yêu cầu tham gia zone' })
  @ApiBearerAuth()
  joinZone(@Param('id') zoneId: string, @CurrentUser('sub') userId: string) {
    return this.joinRequestsService.sendJoinRequest(userId, zoneId);
  }

  @Get(':id/requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tham gia (owner only)' })
  @ApiBearerAuth()
  getJoinRequests(
    @Param('id') zoneId: string,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.joinRequestsService.getJoinRequests(ownerId, zoneId);
  }

  @Patch(':id/requests/:requestId')
  @ApiOperation({ summary: 'Xử lý yêu cầu tham gia (owner only)' })
  @ApiBearerAuth()
  handleJoinRequest(
    @Param('id') zoneId: string,
    @CurrentUser('sub') ownerId: string,
    @Param('requestId') requestId: string,
    @Body('action') action: 'APPROVED' | 'REJECTED',
  ) {
    return this.joinRequestsService.handleJoinRequest(
      ownerId,
      zoneId,
      requestId,
      action,
    );
  }

  @Delete(':id/join')
  @ApiOperation({ summary: 'Hủy yêu cầu tham gia (user only)' })
  @ApiBearerAuth()
  cancelJoinRequest(
    @Param('id') zoneId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.joinRequestsService.cancelJoinRequest(userId, zoneId);
  }
}
