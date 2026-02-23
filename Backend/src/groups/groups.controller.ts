import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  Query,
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
import { GroupsService } from './groups.service';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  PaginationDto,
} from '../common/index.js';

@Controller('groups')
@ApiTags('Groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách groups của user' })
  @ApiBearerAuth()
  getUserGroups(@CurrentUser('sub') userId: string) {
    return this.groupsService.getUserGroups(userId);
  }

  // ========================
  // ADMIN routes (static, must come BEFORE :id)
  // ========================

  @Get('admin')
  @ApiOperation({ summary: 'Danh sách tất cả groups (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAllGroupsAdmin(@Query() pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.groupsService.adminGetAllGroups(Number(page), Number(limit));
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: 'Force dissolve group (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  forceDissolveAdmin(@Param('id') groupId: string) {
    return this.groupsService.adminForceDissolve(groupId);
  }

  @Get('admin/:id/messages')
  @ApiOperation({ summary: 'Xem messages của group (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getGroupMessagesAdmin(
    @Param('id') groupId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { page, limit } = pagination;
    return this.groupsService.adminGetGroupMessages(
      groupId,
      Number(page),
      Number(limit),
    );
  }

  // ========================
  // Dynamic :id routes
  // ========================

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết group' })
  @ApiBearerAuth()
  getGroupDetail(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.getGroupDetail(userId, groupId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Danh sách members của group' })
  @ApiBearerAuth()
  getGroupMembers(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.getGroupMembers(userId, groupId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Rời group' })
  @ApiBearerAuth()
  leaveGroup(@CurrentUser('sub') userId: string, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(userId, groupId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Kick member (leader only)' })
  @ApiBearerAuth()
  kickMember(
    @CurrentUser('sub') leaderId: string,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.kickMember(leaderId, groupId, targetUserId);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Đổi role member (leader only)' })
  @ApiBearerAuth()
  changeMemberRole(
    @CurrentUser('sub') leaderId: string,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    return this.groupsService.changeMemberRole(
      leaderId,
      groupId,
      targetUserId,
      dto.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Giải tán group (leader only)' })
  @ApiBearerAuth()
  dissolveGroup(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.dissolveGroup(userId, groupId);
  }
}
