import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UserResponseDto,
  PublicUserResponseDto,
  SearchUsersDto,
  UserActivityDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/request.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Roles } from 'src/common';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAvatar(
    @CurrentUser() user: JwtPayload,
    @Body('avatarUrl') avatarUrl: string,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(user.sub, avatarUrl);
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Search users by email/username (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [PublicUserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async searchUsers(
    @Query() searchDto: SearchUsersDto,
    @Query() pagination: PaginationDto,
  ): Promise<any> {
    const { page = 1, limit = 20 } = pagination;
    return this.usersService.searchUsers(
      searchDto,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id/activities')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user activity history (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User activity history',
    type: [UserActivityDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivities(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserActivityDto[]> {
    return this.usersService.getUserActivities(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile of another user' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User public profile',
    type: PublicUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicUserResponseDto> {
    return this.usersService.getPublicProfile(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get list of all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [PublicUserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers(@Query() pagination: PaginationDto): Promise<any> {
    const { page = 1, limit = 20 } = pagination;
    return this.usersService.getAllUsersForAdmin(Number(page), Number(limit));
  }

  @Patch(':id/ban')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ban a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User has been banned',
    type: PublicUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (self-ban or already banned)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.usersService.banUser(id, admin.sub);
  }

  @Patch(':id/unban')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unban a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User has been unbanned',
    type: PublicUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request (user not banned)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unBanUser(id);
  }

  @Patch(':id/delete')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user (Admin only - Soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User has been deleted',
  })
  @ApiResponse({ status: 400, description: 'Bad request (self-delete)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.usersService.deleteUser(id, admin.sub);
  }
}
