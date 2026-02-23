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

@ApiTags('Groups')
@ApiBearerAuth('access-token')
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Get()
  @ApiOperation({ summary: 'Danh sách groups của user' })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserGroups(@CurrentUser('sub') userId: string) {
    return this.groupsService.getUserGroups(userId);
  }

  // ========================
  // ADMIN routes (static, must come BEFORE :id)
  // ========================

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Danh sách tất cả groups [ADMIN ONLY]' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAllGroupsAdmin(@Query() pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.groupsService.adminGetAllGroups(Number(page), Number(limit));
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Force dissolve group [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Dissolved' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  forceDissolveAdmin(@Param('id') groupId: string) {
    return this.groupsService.adminForceDissolve(groupId);
  }

  @Get('admin/:id/messages')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xem messages của group [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  getGroupDetail(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.getGroupDetail(userId, groupId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Danh sách members của group' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  getGroupMembers(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.getGroupMembers(userId, groupId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Rời group' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Left successfully' })
  leaveGroup(@CurrentUser('sub') userId: string, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(userId, groupId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Kick member (leader only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiParam({ name: 'userId', description: 'User ID to kick (UUID)' })
  @ApiResponse({ status: 200, description: 'Kicked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not leader)' })
  kickMember(
    @CurrentUser('sub') leaderId: string,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.kickMember(leaderId, groupId, targetUserId);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Đổi role member (leader only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiParam({ name: 'userId', description: 'User ID to change role (UUID)' })
  @ApiResponse({ status: 200, description: 'Role changed successfully' })
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
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Dissolved successfully' })
  dissolveGroup(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
  ) {
    return this.groupsService.dissolveGroup(userId, groupId);
  }
}
