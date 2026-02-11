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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Zones')
@Controller('zones')
@UseGuards(JwtAuthGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo zone mới (tối đa 4 zone)' })
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  findMyZones(@CurrentUser('sub') ownerId: string) {
    return this.zonesService.findAllByOwner(ownerId);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Lấy danh sách tất cả zones (admin only)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAllByAdmin(@Query() pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.zonesService.findAllByAdmin(Number(page), Number(limit));
  }

  @Get(':id/public')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết zone (public)' })
  findOneByPublic(@Param('id') id: string) {
    return this.zonesService.findOneByPublic(id);
  }

  @Get(':id/owner')
  @ApiOperation({ summary: 'Lấy chi tiết zone (owner only)' })
  @ApiBearerAuth()
  findOneByOwner(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.zonesService.findOneByOwner(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật zone (owner only)' })
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateZoneDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.zonesService.update(id, ownerId, updateZoneDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa zone (owner only)' })
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.zonesService.remove(id, ownerId);
  }
}
