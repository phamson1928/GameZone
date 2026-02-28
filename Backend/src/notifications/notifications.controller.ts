import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo (pagination + unreadCount)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser('sub') userId: string,
  ) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    return this.notificationsService.findForUser(page, limit, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  @ApiResponse({ status: 200, description: 'Success' })
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  markRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.markRead(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa 1 thông báo' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.delete(userId, id);
  }
}
