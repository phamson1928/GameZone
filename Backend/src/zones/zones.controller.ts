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
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ZonesService } from './zones.service.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { SearchZonesDto } from './dto/search-zones.dto.js';
import {
  CurrentUser,
  Public,
  JwtAuthGuard,
  RolesGuard,
  Roles,
  PaginationDto,
} from '../common/index.js';

@ApiTags('Zones')
@ApiBearerAuth('access-token')
@Controller('zones')
@UseGuards(JwtAuthGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo zone mới (tối đa 4 zone)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request / Max zones' })
  create(
    @Body() createZoneDto: CreateZoneDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.zonesService.create(ownerId, createZoneDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách tất cả zones (public)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.zonesService.findAllByUser(Number(page), Number(limit));
  }

  // IMPORTANT: Static routes must come BEFORE dynamic routes (:id)
  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm zones với filter và sort' })
  search(@Query() searchDto: SearchZonesDto) {
    return this.zonesService.search(searchDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy danh sách zones của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Success' })
  findMyZones(@CurrentUser('sub') ownerId: string) {
    return this.zonesService.findAllByOwner(ownerId);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách tất cả zones [ADMIN ONLY]' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllByAdmin(@Query() pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.zonesService.findAllByAdmin(Number(page), Number(limit));
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Force delete zone [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  removeByAdmin(@Param('id') id: string) {
    return this.zonesService.adminDeleteZone(id);
  }

  @Patch('admin/:id/close')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Force close zone [ADMIN ONLY]' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Closed' })
  closeByAdmin(@Param('id') id: string) {
    return this.zonesService.adminCloseZone(id);
  }

  @Get(':id/public')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết zone (public)' })
  findOneByPublic(@Param('id') id: string) {
    return this.zonesService.findOneByPublic(id);
  }

  @Get(':id/owner')
  @ApiOperation({ summary: 'Lấy chi tiết zone (owner only)' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOneByOwner(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.zonesService.findOneByOwner(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật zone (owner only)' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateZoneDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.zonesService.update(id, ownerId, updateZoneDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa zone (owner only)' })
  @ApiParam({ name: 'id', description: 'Zone ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.zonesService.remove(id, ownerId);
  }
}
