import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JoinRequestsService } from './join-requests.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('zones')
@ApiTags('Join Requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class JoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) { }

  @Post(':id/join')
  @ApiOperation({ summary: 'Gửi yêu cầu tham gia zone' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Request sent' })
  joinZone(@Param('id') zoneId: string, @CurrentUser('sub') userId: string) {
    return this.joinRequestsService.sendJoinRequest(userId, zoneId);
  }

  @Get(':id/requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tham gia (owner only)' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not owner)' })
  getJoinRequests(
    @Param('id') zoneId: string,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.joinRequestsService.getJoinRequests(ownerId, zoneId);
  }

  @Patch(':id/requests/:requestId')
  @ApiOperation({ summary: 'Xử lý yêu cầu tham gia (owner only)' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiParam({ name: 'requestId', description: 'Request ID (UUID)' })
  @ApiQuery({ name: 'action', enum: ['APPROVED', 'REJECTED'] })
  @ApiResponse({ status: 200, description: 'Processed' })
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
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Canceled' })
  cancelJoinRequest(
    @Param('id') zoneId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.joinRequestsService.cancelJoinRequest(userId, zoneId);
  }
}
