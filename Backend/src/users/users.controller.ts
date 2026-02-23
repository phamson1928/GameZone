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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
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
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/index.js';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin profile người dùng hiện tại',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin profile cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Cập nhật avatar người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật avatar thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async updateAvatar(
    @CurrentUser() user: JwtPayload,
    @Body('avatarUrl') avatarUrl: string,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(user.sub, avatarUrl);
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tìm kiếm người dùng bằng email/username [ADMIN ONLY]' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tìm kiếm',
    type: [PublicUserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
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
  @ApiOperation({ summary: 'Lấy lịch sử hoạt động của người dùng [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử hoạt động',
    type: [UserActivityDto],
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getUserActivities(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserActivityDto[]> {
    return this.usersService.getUserActivities(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem profile công khai của người khác' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin profile công khai',
    type: PublicUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getPublicProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicUserResponseDto> {
    return this.usersService.getPublicProfile(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng [ADMIN ONLY]' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng',
    type: [PublicUserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  async getAllUsers(@Query() pagination: PaginationDto): Promise<any> {
    const { page = 1, limit = 20 } = pagination;
    return this.usersService.getAllUsersForAdmin(Number(page), Number(limit));
  }

  @Patch(':id/ban')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ban người dùng [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Đã ban người dùng thành công',
    type: PublicUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi: Tự ban bản thân hoặc đã bị ban từ trước',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.usersService.banUser(id, admin.sub);
  }

  @Patch(':id/unban')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bỏ ban người dùng [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Đã bỏ ban người dùng thành công',
    type: PublicUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Lỗi: Người dùng chưa bị ban' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unBanUser(id);
  }

  @Patch(':id/delete')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa người dùng (Soft delete) [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa người dùng thành công',
  })
  @ApiResponse({ status: 400, description: 'Lỗi: Tự xóa bản thân' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền (Cần Admin)' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.usersService.deleteUser(id, admin.sub);
  }
}
