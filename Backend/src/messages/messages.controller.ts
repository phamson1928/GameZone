import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageQueryDto } from './dto/message-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
@UseGuards(RolesGuard, JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  /**
   * GET /groups/:id/messages
   * Lấy lịch sử tin nhắn của group. Chỉ member mới được xem.
   */
  @Get('groups/:groupId/messages')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn của group' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử tin nhắn thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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

  /**
   * DELETE /messages/:id
   * Xóa tin nhắn của chính mình.
   */
  @Delete('messages/:id')
  @ApiOperation({ summary: 'Xóa tin nhắn của chính mình' })
  @ApiResponse({ status: 200, description: 'Xóa tin nhắn thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tin nhắn không tồn tại' })
  deleteMessage(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.deleteMessage(req.user.sub, id);
  }

  /**
   * GET /messages/admin
   * Admin lấy danh sách tất cả messages. (Chỉ ADMIN)
   */
  @Roles('ADMIN')
  @Get('messages/admin')
  @ApiOperation({ summary: 'Admin lấy danh sách tất cả messages' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách messages thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  adminGetMessages(@Query() query: MessageQueryDto) {
    return this.messagesService.adminGetMessages(query.page, query.limit);
  }

  /**
   * DELETE /messages/admin/:id
   * Admin xóa bất kỳ tin nhắn nào. (Chỉ ADMIN)
   */
  @Roles('ADMIN')
  @Delete('messages/admin/:id')
  @ApiOperation({ summary: 'Admin xóa bất kỳ tin nhắn nào' })
  @ApiResponse({ status: 200, description: 'Xóa tin nhắn thành công' })
  @ApiResponse({ status: 404, description: 'Tin nhắn không tồn tại' })
  @ApiResponse({ status: 403, description: 'Bạn không có quyền xóa tin nhắn này' })
  adminDeleteMessage(@Param('id') id: string) {
    return this.messagesService.adminDeleteMessage(id);
  }
}