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
import { CurrentUser, Public, JwtAuthGuard } from '../common/index.js';
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
    return this.zonesService.findAll(Number(page), Number(limit));
  }

  // IMPORTANT: Static routes must come BEFORE dynamic routes (:id)
  @Get('my')
  @ApiOperation({ summary: 'Lấy danh sách zones của user hiện tại' })
  @ApiBearerAuth()
  findMyZones(@CurrentUser('sub') ownerId: string) {
    return this.zonesService.findByOwner(ownerId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết zone (public)' })
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
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
