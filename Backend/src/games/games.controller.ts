import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Public, Roles, RolesGuard, PaginationDto } from '../common/index.js';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo game mới [ADMIN ONLY]' })
  @ApiResponse({
    status: 201,
    description: 'Tạo game thành công',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Get('admin')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy tất cả games cho quản trị [ADMIN ONLY]' })
  findAllForAdmin(@Query() query: { page?: string; limit?: string }) {
    return this.gamesService.findAllForAdmin(
      Number(query.page),
      Number(query.limit),
    );
  }

  @Get('mobile')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách games cho người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách games đang hoạt động' })
  findAllForUser() {
    return this.gamesService.findAllForUser();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Xem chi tiết game' })
  @ApiParam({ name: 'id', description: 'Game ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết game' })
  @ApiResponse({ status: 404, description: 'Game không tồn tại' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật game [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Game ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Game không tồn tại' })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa game [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Game ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Game không tồn tại' })
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
