import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
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
import { MessagesService } from './messages.service';
import { MessageQueryDto } from './dto/message-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(RolesGuard, JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Get('groups/:groupId/messages')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn của group' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử tin nhắn thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem' })
  @ApiResponse({ status: 404, description: 'Group không tồn tại' })
  getGroupMessages(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.messagesService.getGroupMessages(
      req.user.sub,
      groupId,
      query.page,
      query.limit,
    );
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Xóa tin nhắn của chính mình (Soft delete)' })
  @ApiParam({ name: 'id', description: 'Message ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa tin nhắn thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Tin nhắn không tồn tại' })
  deleteMessage(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.deleteMessage(req.user.sub, id);
  }

  @Roles('ADMIN')
  @Get('messages/admin')
  @ApiOperation({ summary: 'Lấy danh sách tất cả tin nhắn hệ thống [ADMIN ONLY]' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách messages thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  adminGetMessages(@Query() query: MessageQueryDto) {
    return this.messagesService.adminGetMessages(query.page, query.limit);
  }

  @Roles('ADMIN')
  @Delete('messages/admin/:id')
  @ApiOperation({ summary: 'Admin xóa cưỡng chế bất kỳ tin nhắn nào [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Message ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa tin nhắn thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  @ApiResponse({ status: 404, description: 'Tin nhắn không tồn tại' })
  adminDeleteMessage(@Param('id') id: string) {
    return this.messagesService.adminDeleteMessage(id);
  }
}
