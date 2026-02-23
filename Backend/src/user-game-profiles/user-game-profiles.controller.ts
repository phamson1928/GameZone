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
} from '@nestjs/swagger';
import { UserGameProfilesService } from './user-game-profiles.service';
import { CreateUserGameProfileDto } from './dto/create-user-game-profile.dto';
import { UpdateUserGameProfileDto } from './dto/update-user-game-profile.dto';
import { CurrentUser, JwtAuthGuard } from '../common/index.js';

@ApiTags('User Game Profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('user-game-profiles')
export class UserGameProfilesController {
  constructor(
    private readonly userGameProfilesService: UserGameProfilesService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Thêm hồ sơ game mới cho người dùng' })
  @ApiResponse({ status: 201, description: 'Added' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateUserGameProfileDto,
  ) {
    return this.userGameProfilesService.create(userId, dto);
  }

  // IMPORTANT: Static routes must come BEFORE dynamic routes (:id)
  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ game của bản thân' })
  @ApiResponse({ status: 200, description: 'Success' })
  findMyProfiles(@CurrentUser('sub') userId: string) {
    return this.userGameProfilesService.findAllByMe(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết hồ sơ game' })
  @ApiParam({ name: 'id', description: 'Profile ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(@Param('id') id: string) {
    return this.userGameProfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật rank level của hồ sơ game' })
  @ApiParam({ name: 'id', description: 'Profile ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserGameProfileDto,
  ) {
    return this.userGameProfilesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hồ sơ game' })
  @ApiParam({ name: 'id', description: 'Profile ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.userGameProfilesService.remove(userId, id);
  }
}
